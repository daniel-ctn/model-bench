"use client";

import { FormProvider, useForm } from "react-hook-form";

import { SelectRow, TextField, TextareaField } from "@/components/forms/fields";
import { FormBar, FormSection, useEntitySubmit } from "@/components/forms/form-utils";
import { createTool, updateTool } from "@/app/tools/actions";
import { toolCategoryOptions } from "@/lib/constants";
import { zodFormResolver } from "@/lib/resolver";
import {
  toolDefaults,
  toolFormSchema,
  type ToolFormValues,
} from "@/lib/validations";

export function ToolForm({
  mode,
  toolId,
  initialValues,
}: {
  mode: "create" | "edit";
  toolId?: string;
  initialValues?: ToolFormValues;
}) {
  const form = useForm<ToolFormValues>({
    resolver: zodFormResolver(toolFormSchema),
    defaultValues: initialValues ?? toolDefaults,
  });

  const onSubmit = useEntitySubmit(
    form,
    (values) =>
      mode === "create" ? createTool(values) : updateTool(toolId!, values),
    (id) => `/tools/${id}`,
    mode === "create" ? "Tool added." : "Tool updated.",
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-6">
        <FormSection
          title="Tool"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextField
            name="name"
            label="Name"
            placeholder="e.g. Claude Code"
            required
          />
          <SelectRow
            name="category"
            label="Category"
            options={toolCategoryOptions}
            required
          />
          <div className="sm:col-span-2">
            <TextField
              name="website"
              label="Website"
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <TextareaField
              name="notes"
              label="Notes"
              placeholder="How you use it, strengths, gotchas…"
              rows={4}
            />
          </div>
        </FormSection>

        <FormBar
          cancelHref={toolId ? `/tools/${toolId}` : "/tools"}
          submitLabel={mode === "create" ? "Add tool" : "Save changes"}
          pending={form.formState.isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
