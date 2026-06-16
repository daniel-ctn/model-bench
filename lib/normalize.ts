import { NONE } from "@/lib/validations/shared";

/** Convert a relation <Select> value to a uuid or null. */
export function idOrNull(value: string | null | undefined): string | null {
  return value && value !== NONE ? value : null;
}

/** Trim a string, returning null for empty values. */
export function textOrNull(value: string | null | undefined): string | null {
  const t = (value ?? "").trim();
  return t === "" ? null : t;
}

/** Parse a yyyy-MM-dd input string into a Date anchored at local noon. */
export function dateFromInput(value: string): Date {
  // Noon avoids timezone rollovers shifting the calendar day.
  const d = new Date(`${value}T12:00:00`);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Format a Date back to a yyyy-MM-dd input string. */
export function dateToInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
