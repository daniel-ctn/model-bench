import type { DayCell } from "@/lib/metrics/activity";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Five-step colour scale keyed off the busiest day in range. */
function levelClass(count: number, max: number): string {
  if (count <= 0) return "bg-muted/50";
  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.75) return "bg-primary";
  if (ratio > 0.5) return "bg-primary/75";
  if (ratio > 0.25) return "bg-primary/55";
  return "bg-primary/35";
}

export function ActivityHeatmap({
  weeks,
  maxCount,
}: {
  weeks: DayCell[][];
  maxCount: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="scrollbar-thin overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) =>
                day.future ? (
                  <span key={day.date} className="size-3" />
                ) : (
                  <span
                    key={day.date}
                    className={cn(
                      "size-3 rounded-[3px]",
                      levelClass(day.count, maxCount),
                    )}
                    title={`${formatDate(day.date, "MMM d, yyyy")} · ${day.count} session${day.count === 1 ? "" : "s"}`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <span>Less</span>
        <span className="bg-muted/50 size-3 rounded-[3px]" />
        <span className="bg-primary/35 size-3 rounded-[3px]" />
        <span className="bg-primary/55 size-3 rounded-[3px]" />
        <span className="bg-primary/75 size-3 rounded-[3px]" />
        <span className="bg-primary size-3 rounded-[3px]" />
        <span>More</span>
      </div>
    </div>
  );
}
