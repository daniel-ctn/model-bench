"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

export type DonutItem = { label: string; value: number };

type TooltipProps = {
  active?: boolean;
  payload?: { payload: DonutItem & { percent: number } }[];
};

function DonutTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-1.5 text-xs shadow-md">
      <span className="font-medium">{p.label}</span>{" "}
      <span className="text-muted-foreground">
        · {p.value} ({p.percent.toFixed(0)}%)
      </span>
    </div>
  );
}

export function DonutChart({ data }: { data: DonutItem[] }) {
  if (!data.length) {
    return <ChartEmpty message="No usage recorded yet." />;
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const withPercent = data.map((d) => ({
    ...d,
    percent: total ? (d.value / total) * 100 : 0,
  }));

  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: PALETTE[i % PALETTE.length] }]),
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer
        config={config}
        className="aspect-square h-[180px] shrink-0"
      >
        <PieChart>
          <ChartTooltip content={<DonutTooltip />} />
          <Pie
            data={withPercent}
            dataKey="value"
            nameKey="label"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={2}
          >
            {withPercent.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex w-full flex-col gap-1.5">
        {withPercent.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="truncate">{d.label}</span>
            <span className="text-muted-foreground tabnum ml-auto">
              {d.value}
            </span>
            <span className="text-muted-foreground/70 tabnum w-9 text-right text-xs">
              {d.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
