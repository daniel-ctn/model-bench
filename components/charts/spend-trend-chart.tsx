"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-empty";

const config = {
  cost: { label: "Spend", color: "var(--chart-4)" },
} satisfies ChartConfig;

export type SpendPoint = {
  label: string;
  cost: number;
};

export function SpendTrendChart({
  data,
  budget,
}: {
  data: SpendPoint[];
  budget?: number | null;
}) {
  if (!data.length) {
    return <ChartEmpty message="Log sessions with cost estimates to see spend." />;
  }

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          fontSize={11}
          tickFormatter={(v: number) => `$${v}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
          }
        />
        {budget != null && budget > 0 ? (
          <ReferenceLine
            y={budget}
            stroke="var(--destructive)"
            strokeDasharray="4 4"
            label={{
              value: "Budget",
              position: "insideTopRight",
              fontSize: 10,
              fill: "var(--destructive)",
            }}
          />
        ) : null}
        <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
