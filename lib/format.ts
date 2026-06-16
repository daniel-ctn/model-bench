import { format, formatDistanceToNow, isValid } from "date-fns";

/** "1h 20m", "45m", "0m" — accepts minutes (may be negative for net values). */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h && m) return `${sign}${h}h ${m}m`;
  if (h) return `${sign}${h}h`;
  return `${sign}${m}m`;
}

/** Minutes → hours with one decimal, e.g. "12.5h". */
export function formatHours(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  return `${(minutes / 60).toFixed(1)}h`;
}

export function formatCurrency(
  value: number | null | undefined,
  opts: { precise?: boolean } = {},
): string {
  if (value == null) return "—";
  const digits = opts.precise ? (value < 1 ? 4 : 2) : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatNumber(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${formatNumber(value, 1)}`;
}

export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(
  date: Date | string | null | undefined,
  pattern = "MMM d, yyyy",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "—";
  return format(d, pattern);
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

/** Large context windows → "200K", "1M". */
export function formatTokens(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}
