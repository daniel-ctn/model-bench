"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from "react-hook-form";
import { toast } from "sonner";
import {
  Bot,
  FlaskConical,
  Loader2,
  Palette,
  PenLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  NumberField,
  ScoreSliderField,
  SelectRow,
  SwitchRow,
  TagsFieldRow,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSession, updateSession } from "@/app/sessions/actions";
import type { FormLookups } from "@/db/queries/lookups";
import { zodFormResolver } from "@/lib/resolver";
import {
  interventionOptions,
  quotaFeelingOptions,
  resultStatusOptions,
  SECONDARY_SCORE_FIELDS,
  failureTypeOptions,
  severityOptions,
  taskTypeOptions,
  workflowTypeOptions,
} from "@/lib/constants";
import {
  failurePatternDefault,
  makeSessionDefaults,
  sessionFormSchema,
  type SessionFormValues,
} from "@/lib/validations";

type PresetKey =
  | "coding-agent"
  | "ui-refactor"
  | "research"
  | "writing"
  | "comparison";

const PRESETS: { key: PresetKey; label: string; icon: typeof Bot }[] = [
  { key: "coding-agent", label: "Coding agent", icon: Bot },
  { key: "ui-refactor", label: "UI / refactor", icon: Palette },
  { key: "research", label: "Research", icon: Search },
  { key: "writing", label: "Writing", icon: PenLine },
  { key: "comparison", label: "Model comparison", icon: FlaskConical },
];

function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  );
}

export function SessionForm({
  lookups,
  mode,
  sessionId,
  initialValues,
}: {
  lookups: FormLookups;
  mode: "create" | "edit";
  sessionId?: string;
  initialValues?: SessionFormValues;
}) {
  const router = useRouter();
  const form = useForm<SessionFormValues>({
    resolver: zodFormResolver(sessionFormSchema),
    defaultValues: initialValues ?? makeSessionDefaults(),
  });
  const { control, handleSubmit, setValue, getValues, setError } = form;

  const failures = useFieldArray({ control, name: "failurePatterns" });

  const testsRun = useWatch({ control, name: "testsRun" });
  const requiredFollowup = useWatch({ control, name: "requiredFollowupModel" });

  const projectOptions = [
    { value: "none", label: "No project" },
    ...lookups.projects.map((p) => ({ value: p.id, label: p.name })),
  ];
  const toolOptions = [
    { value: "none", label: "No tool" },
    ...lookups.tools.map((t) => ({ value: t.id, label: t.name })),
  ];
  const modelOptions = [
    { value: "none", label: "No model" },
    ...lookups.models.map((m) => ({
      value: m.id,
      label: m.shortName ?? m.name,
    })),
  ];

  function applyPreset(key: PresetKey) {
    const set = (name: Path<SessionFormValues>, value: unknown) =>
      setValue(name, value as never, { shouldDirty: true });
    const enableScores = (keys: string[]) => {
      for (const f of SECONDARY_SCORE_FIELDS) {
        set(
          f.key as Path<SessionFormValues>,
          keys.includes(f.key) ? (getValues(f.key) ?? 7) : null,
        );
      }
    };

    switch (key) {
      case "coding-agent":
        set("taskType", "backend-api");
        set("workflowType", "agent-autonomous");
        set("humanInterventionLevel", "light-review");
        set("testsRun", true);
        enableScores([
          "speedScore",
          "codeQualityScore",
          "reliabilityScore",
          "costValueScore",
        ]);
        break;
      case "ui-refactor":
        set("taskType", "frontend-ui");
        set("workflowType", "pair-programming");
        set("humanInterventionLevel", "moderate-edits");
        enableScores(["speedScore", "codeQualityScore", "uiTasteScore"]);
        break;
      case "research":
        set("taskType", "research");
        set("workflowType", "research-assistant");
        set("testsRun", false);
        enableScores(["speedScore", "intentUnderstandingScore"]);
        break;
      case "writing":
        set("taskType", "writing");
        set("workflowType", "writing-assistant");
        set("testsRun", false);
        enableScores(["speedScore", "intentUnderstandingScore"]);
        break;
      case "comparison": {
        const tags = getValues("tags");
        if (!tags.includes("comparison")) set("tags", [...tags, "comparison"]);
        set("requiredFollowupModel", true);
        enableScores(SECONDARY_SCORE_FIELDS.map((f) => f.key));
        break;
      }
    }
    toast.message(`Applied “${PRESETS.find((p) => p.key === key)?.label}” preset`);
  }

  const onSubmit = handleSubmit(async (values) => {
    const res =
      mode === "create"
        ? await createSession(values)
        : await updateSession(sessionId!, values);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [key, messages] of Object.entries(res.fieldErrors)) {
          setError(key as Path<SessionFormValues>, {
            message: messages.join(", "),
          });
        }
      }
      toast.error(res.error);
      return;
    }
    toast.success(mode === "create" ? "Session logged." : "Session updated.");
    router.push(`/sessions/${res.data.id}`);
    router.refresh();
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-6">
        {/* Presets */}
        <div className="bg-card/40 flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <span className="text-muted-foreground mr-1 text-xs font-medium">
            Quick start:
          </span>
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p.key)}
            >
              <p.icon />
              {p.label}
            </Button>
          ))}
        </div>

        <FormSection
          title="Basics"
          description="What was this session and where did it happen?"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <TextField
              name="title"
              label="Title"
              placeholder="e.g. Refactor checkout flow into server actions"
              required
            />
          </div>
          <TextField name="date" label="Date" type="date" required />
          <SelectRow name="projectId" label="Project" options={projectOptions} />
          <SelectRow name="toolId" label="Tool" options={toolOptions} />
          <SelectRow name="modelId" label="Model" options={modelOptions} />
          <SelectRow
            name="taskType"
            label="Task type"
            options={taskTypeOptions}
            required
          />
          <SelectRow
            name="workflowType"
            label="Workflow"
            options={workflowTypeOptions}
            required
          />
        </FormSection>

        <FormSection
          title="Outcome & effort"
          description="How did it go, and what did it cost you?"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SelectRow
            name="resultStatus"
            label="Result"
            options={resultStatusOptions}
            required
          />
          <SelectRow
            name="humanInterventionLevel"
            label="Human intervention"
            options={interventionOptions}
          />
          <SelectRow
            name="quotaFeeling"
            label="Quota / cost feeling"
            options={quotaFeelingOptions}
          />
          <NumberField
            name="timeSpentMinutes"
            label="Time spent"
            suffix="min"
            min={0}
          />
          <NumberField
            name="estimatedTimeSavedMinutes"
            label="Est. time saved"
            suffix="min"
            min={0}
          />
          <NumberField
            name="estimatedCostUsd"
            label="Est. cost"
            suffix="USD"
            min={0}
            step={0.01}
            nullable
            placeholder="optional"
          />
        </FormSection>

        <FormSection
          title="Scores"
          description="Rate quality (required). Add the secondary scores that matter for this task."
          className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2"
        >
          <ScoreSliderField name="qualityScore" label="Quality" />
          {SECONDARY_SCORE_FIELDS.map((f) => (
            <ScoreSliderField key={f.key} name={f.key} label={f.label} optional />
          ))}
        </FormSection>

        <FormSection
          title="Signals"
          description="Reliability signals that feed the reliability index."
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <SwitchRow name="testsRun" label="Tests were run" />
          {testsRun ? (
            <SwitchRow name="testsPassed" label="Tests passed" />
          ) : (
            <div className="hidden sm:block" />
          )}
          <SwitchRow
            name="causedRegression"
            label="Caused a regression"
          />
          <SwitchRow
            name="requiredFollowupModel"
            label="Needed a follow-up model"
          />
          {requiredFollowup ? (
            <div className="sm:col-span-2">
              <SelectRow
                name="followupModelId"
                label="Follow-up model"
                options={modelOptions}
              />
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title="Notes & reflection"
          description="The journal part — your future self will thank you."
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextareaField
            name="promptSummary"
            label="Prompt summary"
            placeholder="What did you ask for?"
          />
          <TextareaField
            name="outputSummary"
            label="Output summary"
            placeholder="What did it produce?"
          />
          <div className="sm:col-span-2">
            <TextareaField
              name="taskDescription"
              label="Task description"
              placeholder="More context on the task"
            />
          </div>
          <TextareaField
            name="whatWorked"
            label="What worked"
            placeholder="What the model did well"
          />
          <TextareaField
            name="whatFailed"
            label="What failed"
            placeholder="Where it fell short"
          />
          <div className="sm:col-span-2">
            <TextareaField
              name="doDifferently"
              label="What I'd do differently"
              placeholder="Next time…"
            />
          </div>
          <div className="sm:col-span-2">
            <TextareaField name="notes" label="Notes" placeholder="Anything else" />
          </div>
          <div className="sm:col-span-2">
            <TagsFieldRow
              name="tags"
              label="Tags"
              description="Press Enter or comma to add."
            />
          </div>
        </FormSection>

        <FormSection
          title="Failure patterns"
          description="Log specific failure modes to spot recurring weaknesses."
        >
          <div className="flex flex-col gap-3">
            {failures.fields.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No failure patterns logged for this session.
              </p>
            ) : (
              failures.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border-border/60 relative grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2"
                >
                  <SelectRow
                    name={`failurePatterns.${index}.type`}
                    label="Type"
                    options={failureTypeOptions}
                  />
                  <SelectRow
                    name={`failurePatterns.${index}.severity`}
                    label="Severity"
                    options={severityOptions}
                  />
                  <TextareaField
                    name={`failurePatterns.${index}.description`}
                    label="Description"
                    rows={2}
                  />
                  <TextareaField
                    name={`failurePatterns.${index}.possibleFix`}
                    label="Possible fix"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => failures.remove(index)}
                    className="text-muted-foreground hover:text-destructive absolute top-2 right-2"
                    aria-label="Remove failure pattern"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => failures.append({ ...failurePatternDefault })}
            >
              <Plus />
              Add failure pattern
            </Button>
          </div>
        </FormSection>

        {/* Floating sticky action bar */}
        <div className="sticky bottom-4 z-20 mt-1">
          <div className="bg-card/95 flex items-center justify-end gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              render={
                <Link href={sessionId ? `/sessions/${sessionId}` : "/sessions"} />
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {mode === "create" ? "Log session" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
