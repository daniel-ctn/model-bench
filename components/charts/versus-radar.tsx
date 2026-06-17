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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

export type VersusRadarPoint = {
  label: string;
  a: number;
  b: number;
};

export function VersusRadar({
  data,
  aLabel,
  bLabel,
}: {
  data: VersusRadarPoint[];
  aLabel: string;
  bLabel: string;
}) {
  if (data.length < 3) {
    return (
      <ChartEmpty message="Need at least three shared score dimensions to plot a radar." />
    );
  }

  const config = {
    a: { label: aLabel, color: "var(--chart-1)" },
    b: { label: bLabel, color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto h-[280px] w-full">
      <RadarChart data={data} margin={{ top: 8, bottom: 8 }}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="label" fontSize={11} />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          dataKey="a"
          stroke="var(--color-a)"
          fill="var(--color-a)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Radar
          dataKey="b"
          stroke="var(--color-b)"
          fill="var(--color-b)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
}
