"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

const config = {
  saved: { label: "Time saved", color: "var(--chart-2)" },
  spent: { label: "Time spent", color: "var(--chart-4)" },
} satisfies ChartConfig;

export type TimeBalancePoint = {
  label: string;
  /** Hours. */
  saved: number;
  spent: number;
};

export function TimeBalanceChart({ data }: { data: TimeBalancePoint[] }) {
  if (!data.length) {
    return <ChartEmpty message="Log sessions with time estimates to compare." />;
  }

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="saved" fill="var(--color-saved)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
