import { cn } from "@/lib/utils";
import type { Tone } from "@/types";

const toneClasses: Record<Tone, string> = {
  primary: "border-primary/25 bg-primary/15 text-primary",
  success: "border-success/25 bg-success/15 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning",
  danger: "border-destructive/25 bg-destructive/15 text-destructive",
  info: "border-info/25 bg-info/15 text-info",
  neutral: "border-border bg-muted text-muted-foreground",
};

/**
 * A small status pill driven by the design-system tone tokens. Used for result
 * statuses, severities, worth-it verdicts, etc. across the app.
 */
export function ToneBadge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
