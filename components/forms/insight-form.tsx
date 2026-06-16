"use client";

import { FormProvider, useForm } from "react-hook-form";

import { SelectRow, TextField, TextareaField } from "@/components/forms/fields";
import { FormBar, FormSection, useEntitySubmit } from "@/components/forms/form-utils";
import { createInsight, updateInsight } from "@/app/insights/actions";
import type { FormLookups } from "@/db/queries/lookups";
import { confidenceOptions, insightStatusOptions } from "@/lib/constants";
import { zodFormResolver } from "@/lib/resolver";
import {
  insightDefaults,
  insightFormSchema,
  type InsightFormValues,
} from "@/lib/validations";

export function InsightForm({
  lookups,
  mode,
  insightId,
  initialValues,
}: {
  lookups: FormLookups;
  mode: "create" | "edit";
  insightId?: string;
  initialValues?: InsightFormValues;
}) {
  const form = useForm<InsightFormValues>({
    resolver: zodFormResolver(insightFormSchema),
    defaultValues: initialValues ?? insightDefaults,
  });

  const onSubmit = useEntitySubmit(
    form,
    (values) =>
      mode === "create"
        ? createInsight(values)
        : updateInsight(insightId!, values),
    () => `/insights`,
    mode === "create" ? "Insight saved." : "Insight updated.",
  );

  const modelOptions = [
    { value: "none", label: "No model" },
    ...lookups.models.map((m) => ({ value: m.id, label: m.shortName ?? m.name })),
  ];
  const toolOptions = [
    { value: "none", label: "No tool" },
    ...lookups.tools.map((t) => ({ value: t.id, label: t.name })),
  ];
  const projectOptions = [
    { value: "none", label: "No project" },
    ...lookups.projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-6">
        <FormSection title="Insight" className="flex flex-col gap-4">
          <TextField
            name="title"
            label="Title"
            placeholder="e.g. Claude Code is better for large UI refactors"
            required
          />
          <TextareaField
            name="description"
            label="Description"
            placeholder="What did you observe, and when does it apply?"
            rows={4}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectRow
              name="confidence"
              label="Confidence"
              options={confidenceOptions}
            />
            <SelectRow
              name="status"
              label="Status"
              options={insightStatusOptions}
            />
          </div>
        </FormSection>

        <FormSection
          title="Links"
          description="Attach this insight to what it's about."
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <SelectRow name="relatedModelId" label="Model" options={modelOptions} />
          <SelectRow name="relatedToolId" label="Tool" options={toolOptions} />
          <SelectRow
            name="relatedProjectId"
            label="Project"
            options={projectOptions}
          />
        </FormSection>

        <FormBar
          cancelHref="/insights"
          submitLabel={mode === "create" ? "Save insight" : "Save changes"}
          pending={form.formState.isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
