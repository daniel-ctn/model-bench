import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatDelta = {
  /** Percentage change vs the comparison period. */
  value: number;
  /** When true (default) an increase is rendered as positive/green. */
  positiveIsGood?: boolean;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  delta?: StatDelta | null;
  className?: string;
}) {
  const showDelta = delta && Number.isFinite(delta.value) && delta.value !== 0;
  const positiveIsGood = delta?.positiveIsGood ?? true;
  const isUp = (delta?.value ?? 0) > 0;
  const isGood = isUp === positiveIsGood;

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </span>
          {Icon ? <Icon className="text-muted-foreground/60 size-4" /> : null}
        </div>
        <div className="tabnum text-2xl font-semibold tracking-tight">
          {value}
        </div>
        {(showDelta || hint) && (
          <div className="flex items-center gap-2 text-xs">
            {showDelta ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  isGood ? "text-success" : "text-destructive",
                )}
              >
                {isUp ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(delta!.value).toFixed(0)}%
              </span>
            ) : null}
            {hint ? (
              <span className="text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
