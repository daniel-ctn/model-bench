"use client";

import {
  Area,
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

const config = {
  quality: { label: "Quality", color: "var(--chart-1)" },
  reliability: { label: "Reliability", color: "var(--chart-2)" },
} satisfies ChartConfig;

export type ScoreTrendPoint = {
  date: string;
  label: string;
  quality: number | null;
  /** Reliability is 0–100; we rescale to 0–10 to share the axis. */
  reliability: number | null;
};

export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  if (data.length < 2) {
    return <ChartEmpty message="Not enough sessions yet to plot a trend." />;
  }

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <ComposedChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillQuality" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-quality)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-quality)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          fontSize={11}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tickLine={false}
          axisLine={false}
          width={32}
          fontSize={11}
        />
        <ReferenceLine
          y={7}
          stroke="var(--success)"
          strokeOpacity={0.4}
          strokeDasharray="2 4"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="quality"
          type="monotone"
          stroke="var(--color-quality)"
          strokeWidth={2}
          fill="url(#fillQuality)"
          dot={false}
          connectNulls
        />
        <Line
          dataKey="reliability"
          type="monotone"
          stroke="var(--color-reliability)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ChartContainer>
  );
}
