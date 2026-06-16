import { cn } from "@/lib/utils";

export function TagList({
  tags,
  max,
  className,
}: {
  tags: string[] | null | undefined;
  max?: number;
  className?: string;
}) {
  if (!tags?.length) return null;
  const shown = max ? tags.slice(0, max) : tags;
  const rest = max ? tags.length - shown.length : 0;

  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((t) => (
        <span
          key={t}
          className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] leading-none"
        >
          #{t}
        </span>
      ))}
      {rest > 0 ? (
        <span className="text-muted-foreground/70 text-[11px]">+{rest}</span>
      ) : null}
    </span>
  );
}
