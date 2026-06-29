import { cn } from "@/lib/utils";
import { MARK } from "./geometry";

type Variant = "tile" | "open";

export type LogoMarkProps = {
  /**
   * `tile` — white mark on the brand-violet rounded square (favicon / nav / app
   * chrome). `open` — two-tone mark (foreground M + violet accent) on a
   * transparent surface.
   */
  variant?: Variant;
  /** Play the one-shot "measurement settles" reveal on mount (reduced-motion safe). */
  animated?: boolean;
  /** Sizing/extra classes. For `tile` this sizes the square; for `open` the svg. */
  className?: string;
  /** Accessible label. Omit to render the mark as decorative (aria-hidden). */
  title?: string;
};

/**
 * The ModelBench "Measured-M" brand mark. Geometry is shared with the static
 * asset generator via {@link MARK} so every surface is identical.
 */
export function LogoMark({
  variant = "open",
  animated = false,
  className,
  title,
}: LogoMarkProps) {
  // On the violet tile the whole mark is white (currentColor); on an open
  // surface the accent carries the live brand hue and adapts to dark/light.
  const accent = variant === "tile" ? "currentColor" : "var(--primary)";
  const labelled = Boolean(title);

  const svg = (
    <svg
      viewBox="0 0 32 32"
      className={variant === "tile" ? "size-[78%]" : cn("size-full", className)}
      fill="none"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {labelled ? <title>{title}</title> : null}
      <g className={animated ? "mb-anim" : undefined}>
        <path
          className="mb-m"
          d={MARK.m}
          stroke="currentColor"
          strokeWidth={MARK.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="mb-bench"
          d={MARK.bench}
          stroke={accent}
          strokeWidth={MARK.stroke}
          strokeLinecap="round"
        />
        <path
          className="mb-tick"
          d={MARK.tick}
          stroke={accent}
          strokeWidth={MARK.stroke}
          strokeLinecap="round"
        />
        <circle
          className="mb-node"
          cx={MARK.node.cx}
          cy={MARK.node.cy}
          r={MARK.node.r}
          fill={accent}
        />
      </g>
    </svg>
  );

  if (variant === "open") return svg;

  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground ring-primary/20 inline-flex shrink-0 items-center justify-center rounded-lg shadow-sm ring-1",
        className,
      )}
    >
      {svg}
    </span>
  );
}
