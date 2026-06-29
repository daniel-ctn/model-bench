import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export type LogoProps = {
  /** Animate the mark's one-shot reveal (use in nav/auth; static elsewhere). */
  animated?: boolean;
  /** Hide the "ModelBench / Journal" wordmark, leaving just the mark. */
  markOnly?: boolean;
  className?: string;
  markClassName?: string;
};

/**
 * Horizontal ModelBench lockup: the violet tile mark + the Space Grotesk
 * wordmark with a "Journal" ledger eyebrow. Renders the wordmark as live text
 * so it stays crisp and theme-aware.
 */
export function Logo({
  animated = false,
  markOnly = false,
  className,
  markClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark
        variant="tile"
        animated={animated}
        title="ModelBench"
        className={cn("size-9", markClassName)}
      />
      {markOnly ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-foreground text-base font-semibold tracking-tight">
            ModelBench
          </span>
          <span className="eyebrow text-muted-foreground/75 mt-1">Journal</span>
        </span>
      )}
    </span>
  );
}
