"use client";

import { FormProvider, useForm } from "react-hook-form";

import {
  NumberField,
  SelectRow,
  SwitchRow,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { FormBar, FormSection, useEntitySubmit } from "@/components/forms/form-utils";
import { createModel, updateModel } from "@/app/models/actions";
import { modelProviderOptions, modelStrengthOptions } from "@/lib/constants";
import { zodFormResolver } from "@/lib/resolver";
import {
  modelDefaults,
  modelFormSchema,
  type ModelFormValues,
} from "@/lib/validations";

export function ModelForm({
  mode,
  modelId,
  initialValues,
}: {
  mode: "create" | "edit";
  modelId?: string;
  initialValues?: ModelFormValues;
}) {
  const form = useForm<ModelFormValues>({
    resolver: zodFormResolver(modelFormSchema),
    defaultValues: initialValues ?? modelDefaults,
  });

  const onSubmit = useEntitySubmit(
    form,
    (values) =>
      mode === "create" ? createModel(values) : updateModel(modelId!, values),
    (id) => `/models/${id}`,
    mode === "create" ? "Model added." : "Model updated.",
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-6">
        <FormSection
          title="Identity"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <SelectRow
            name="provider"
            label="Provider"
            options={modelProviderOptions}
            required
          />
          <SelectRow
            name="strengthLevel"
            label="Strength level"
            options={modelStrengthOptions}
            required
          />
          <TextField
            name="name"
            label="Name"
            placeholder="e.g. GPT-5.5"
            required
          />
          <TextField
            name="shortName"
            label="Short name"
            placeholder="e.g. GPT-5.5"
          />
          <TextField
            name="modelFamily"
            label="Model family"
            placeholder="e.g. GPT-5"
          />
          <div className="flex items-end">
            <div className="w-full">
              <SwitchRow
                name="active"
                label="Active"
                description="Show in pickers and reports."
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Pricing & limits"
          description="Optional — used for cost-value analysis."
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <NumberField
            name="pricingInputPerMTok"
            label="Input price"
            suffix="$/Mtok"
            step={0.01}
            nullable
            placeholder="optional"
          />
          <NumberField
            name="pricingOutputPerMTok"
            label="Output price"
            suffix="$/Mtok"
            step={0.01}
            nullable
            placeholder="optional"
          />
          <NumberField
            name="contextWindow"
            label="Context window"
            suffix="tokens"
            step={1000}
            nullable
            placeholder="optional"
          />
          <TextField
            name="knowledgeCutoff"
            label="Knowledge cutoff"
            placeholder="e.g. Oct 2025"
          />
        </FormSection>

        <FormSection title="Notes">
          <TextareaField
            name="notes"
            label="Notes"
            placeholder="Strengths, quirks, when to reach for it…"
            rows={4}
          />
        </FormSection>

        <FormBar
          cancelHref={modelId ? `/models/${modelId}` : "/models"}
          submitLabel={mode === "create" ? "Add model" : "Save changes"}
          pending={form.formState.isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
