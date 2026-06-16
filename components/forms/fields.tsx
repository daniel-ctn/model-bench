"use client";

import {
  Controller,
  useFormContext,
  type FieldErrors,
} from "react-hook-form";

import { SelectField } from "@/components/select-field";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_COLORS, type Option } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TagsInput } from "./tags-input";

function getError(errors: FieldErrors, name: string): string | undefined {
  const parts = name.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (cur && typeof cur === "object")
      cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  const msg = (cur as { message?: unknown } | undefined)?.message;
  return typeof msg === "string" ? msg : undefined;
}

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function TextField({
  name,
  label,
  placeholder,
  description,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  required?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = getError(errors, name);
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={name}>
        {label}
        {required ? <RequiredMark /> : null}
      </FieldLabel>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...register(name)}
      />
      {description && !error ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  placeholder,
  description,
  rows = 3,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  rows?: number;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = getError(errors, name);
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...register(name)}
      />
      {description && !error ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function SelectRow({
  name,
  label,
  options,
  placeholder,
  description,
  required,
}: {
  name: string;
  label: string;
  options: readonly Option[];
  placeholder?: string;
  description?: string;
  required?: boolean;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getError(errors, name);
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={name}>
        {label}
        {required ? <RequiredMark /> : null}
      </FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SelectField
            id={name}
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
            options={options}
            placeholder={placeholder}
            ariaInvalid={!!error}
          />
        )}
      />
      {description && !error ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function NumberField({
  name,
  label,
  placeholder,
  description,
  min = 0,
  step,
  suffix,
  nullable,
}: {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  min?: number;
  step?: number;
  suffix?: string;
  nullable?: boolean;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getError(errors, name);
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="relative">
            <Input
              id={name}
              type="number"
              inputMode="decimal"
              min={min}
              step={step}
              placeholder={placeholder}
              aria-invalid={!!error}
              className={cn(suffix && "pr-12")}
              value={field.value ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") field.onChange(nullable ? null : 0);
                else field.onChange(Number(raw));
              }}
            />
            {suffix ? (
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                {suffix}
              </span>
            ) : null}
          </div>
        )}
      />
      {description && !error ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function SwitchRow({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description?: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field
          orientation="horizontal"
          className="border-border/60 rounded-lg border px-3 py-2.5"
        >
          <FieldContent>
            <FieldLabel htmlFor={name} className="cursor-pointer">
              {label}
            </FieldLabel>
            {description ? (
              <FieldDescription>{description}</FieldDescription>
            ) : null}
          </FieldContent>
          <Switch
            id={name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        </Field>
      )}
    />
  );
}

export function ScoreSliderField({
  name,
  label,
  optional,
}: {
  name: string;
  label: string;
  optional?: boolean;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const enabled = field.value != null;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              {optional ? (
                enabled ? (
                  <span className="flex items-center gap-2">
                    <span className="tabnum text-sm font-semibold">
                      {field.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      clear
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => field.onChange(7)}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    + rate
                  </button>
                )
              ) : (
                <span className="tabnum text-sm font-semibold">
                  {field.value}
                </span>
              )}
            </div>
            {!optional || enabled ? (
              <Slider
                min={1}
                max={10}
                step={1}
                value={field.value ?? 7}
                onValueChange={(v) =>
                  field.onChange(Array.isArray(v) ? v[0] : v)
                }
              />
            ) : null}
          </div>
        );
      }}
    />
  );
}

export function ColorField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => field.onChange(c)}
                aria-label={c}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-110",
                  field.value === c
                    ? "border-foreground"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="border-border relative size-7 cursor-pointer overflow-hidden rounded-full border">
              <input
                type="color"
                value={field.value ?? "#7c5cff"}
                onChange={(e) => field.onChange(e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className="block size-full"
                style={{ backgroundColor: field.value }}
              />
            </label>
          </div>
        </Field>
      )}
    />
  );
}

export function TagsFieldRow({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description?: string;
}) {
  const { control } = useFormContext();
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TagsInput value={field.value ?? []} onChange={field.onChange} id={name} />
        )}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
