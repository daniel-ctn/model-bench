"use client";

import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import { ChartEmpty } from "./chart-empty";

const config = {
  quality: { label: "Quality", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type CostValuePoint = {
  cost: number;
  quality: number;
  label: string;
  model: string;
};

/** Tier a point by quality so colour carries meaning, not just position. */
function pointColor(q: number): string {
  if (q >= 8) return "var(--success)";
  if (q >= 6) return "var(--info)";
  if (q >= 4) return "var(--warning)";
  return "var(--destructive)";
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: CostValuePoint }[];
};

function CostValueTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 max-w-[200px] truncate font-medium">{p.label}</p>
      <p className="text-muted-foreground">{p.model}</p>
      <div className="mt-1.5 flex gap-3">
        <span>
          Cost <span className="text-foreground">{formatCurrency(p.cost, { precise: true })}</span>
        </span>
        <span>
          Quality <span className="text-foreground">{p.quality}/10</span>
        </span>
      </div>
    </div>
  );
}

export function CostValueScatter({ data }: { data: CostValuePoint[] }) {
  if (!data.length) {
    return (
      <ChartEmpty message="Add cost estimates to sessions to map cost vs quality." />
    );
  }

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <ScatterChart margin={{ left: -8, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="cost"
          name="Cost"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          tickFormatter={(v: number) => formatCurrency(v)}
        />
        <YAxis
          type="number"
          dataKey="quality"
          name="Quality"
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tickLine={false}
          axisLine={false}
          width={28}
          fontSize={11}
        />
        <ZAxis type="number" range={[70, 70]} />
        <ReferenceLine
          y={7}
          stroke="var(--success)"
          strokeOpacity={0.4}
          strokeDasharray="2 4"
          label={{
            value: "Good",
            position: "insideTopLeft",
            fontSize: 10,
            fill: "var(--success)",
            opacity: 0.7,
          }}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={<CostValueTooltip />}
        />
        <Scatter data={data} fillOpacity={0.75}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={pointColor(d.quality)}
              stroke={pointColor(d.quality)}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ChartContainer>
  );
}
