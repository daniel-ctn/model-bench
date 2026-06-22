"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

const config = {
  saved: { label: "Time saved", color: "var(--chart-2)" },
  spent: { label: "Time spent", color: "var(--chart-4)" },
  net: { label: "Net", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type TimeBalancePoint = {
  label: string;
  /** Hours. */
  saved: number;
  spent: number;
};

type Row = { label: string; saved: number; spent: number; net: number };

function BalanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const rows: [string, string, number][] = [
    ["Saved", "var(--chart-2)", p.saved],
    ["Spent", "var(--chart-4)", Math.abs(p.spent)],
    ["Net", "var(--chart-1)", p.net],
  ];
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium">{p.label}</p>
      <div className="flex flex-col gap-1">
        {rows.map(([name, color, value]) => (
          <div key={name} className="flex items-center gap-2">
            <span
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{name}</span>
            <span className="tabnum text-foreground ml-auto">
              {value > 0 && name === "Net" ? "+" : ""}
              {value}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeBalanceChart({ data }: { data: TimeBalancePoint[] }) {
  if (!data.length) {
    return <ChartEmpty message="Log sessions with time estimates to compare." />;
  }

  // Spent dives below the axis so each day reads as a net surplus/deficit.
  const rows: Row[] = data.map((d) => ({
    label: d.label,
    saved: d.saved,
    spent: -d.spent,
    net: Math.round((d.saved - d.spent) * 10) / 10,
  }));

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <ComposedChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          fontSize={11}
          unit="h"
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip cursor={{ fillOpacity: 0.06 }} content={<BalanceTooltip />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="saved" fill="var(--color-saved)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" fill="var(--color-spent)" radius={[0, 0, 4, 4]} />
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "var(--color-net)", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
