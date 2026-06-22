import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types";

export type StatDelta = {
  /** Percentage change vs the comparison period. */
  value: number;
  /** When true (default) an increase is rendered as positive/green. */
  positiveIsGood?: boolean;
};

const accentChip: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  delta?: StatDelta | null;
  /** Tints the icon into a coloured chip so KPIs read as distinct types. */
  accent?: Tone;
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
          <span className="eyebrow text-muted-foreground">{label}</span>
          {Icon ? (
            accent ? (
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  accentChip[accent],
                )}
              >
                <Icon className="size-4" />
              </span>
            ) : (
              <Icon className="text-muted-foreground/60 size-4" />
            )
          ) : null}
        </div>
        <div className="tabnum font-heading text-2xl font-semibold tracking-tight">
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
