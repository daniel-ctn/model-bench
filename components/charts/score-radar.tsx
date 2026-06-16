"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  value: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ScoreRadar({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ChartContainer config={config} className="mx-auto h-[240px] w-full">
      <RadarChart data={data} margin={{ top: 8, bottom: 8 }}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="label" fontSize={11} />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
