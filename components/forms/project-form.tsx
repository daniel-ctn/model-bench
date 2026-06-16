"use client";

import { FormProvider, useForm } from "react-hook-form";

import {
  ColorField,
  SelectRow,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { FormBar, FormSection, useEntitySubmit } from "@/components/forms/form-utils";
import { createProject, updateProject } from "@/app/projects/actions";
import { projectStatusOptions, projectTypeOptions } from "@/lib/constants";
import { zodFormResolver } from "@/lib/resolver";
import {
  projectDefaults,
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/validations";

export function ProjectForm({
  mode,
  projectId,
  initialValues,
}: {
  mode: "create" | "edit";
  projectId?: string;
  initialValues?: ProjectFormValues;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodFormResolver(projectFormSchema),
    defaultValues: initialValues ?? projectDefaults,
  });

  const onSubmit = useEntitySubmit(
    form,
    (values) =>
      mode === "create"
        ? createProject(values)
        : updateProject(projectId!, values),
    (id) => `/projects/${id}`,
    mode === "create" ? "Project created." : "Project updated.",
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-6">
        <FormSection
          title="Project"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextField
            name="name"
            label="Name"
            placeholder="e.g. SmartTrips"
            required
          />
          <TextField
            name="slug"
            label="Slug"
            placeholder="auto from name"
            description="Lowercase, dashes. Leave blank to auto-generate."
          />
          <SelectRow name="type" label="Type" options={projectTypeOptions} />
          <SelectRow
            name="status"
            label="Status"
            options={projectStatusOptions}
          />
          <div className="sm:col-span-2">
            <ColorField name="color" label="Accent colour" />
          </div>
          <div className="sm:col-span-2">
            <TextareaField
              name="description"
              label="Description"
              placeholder="What is this project?"
              rows={3}
            />
          </div>
        </FormSection>

        <FormBar
          cancelHref={projectId ? `/projects/${projectId}` : "/projects"}
          submitLabel={mode === "create" ? "Create project" : "Save changes"}
          pending={form.formState.isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
