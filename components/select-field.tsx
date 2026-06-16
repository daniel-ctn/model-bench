"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Option } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Thin wrapper over the base-ui Select that resolves option labels (via the
 * `items` prop) and exposes a simple value/onValueChange API. Used by both the
 * filter bar and forms.
 */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  size = "default",
  className,
  id,
  disabled,
  ariaInvalid,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly Option[];
  placeholder?: string;
  size?: "sm" | "default";
  className?: string;
  id?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
}) {
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      items={items}
    >
      <SelectTrigger
        size={size}
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
