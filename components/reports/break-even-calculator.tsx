"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [20, 100, 200];

/**
 * Compares the user's typical notional (API-equivalent) monthly spend against a
 * flat subscription price to answer "is the plan worth it for me?".
 */
export function BreakEvenCalculator({
  monthlySpend,
}: {
  monthlySpend: number;
}) {
  const [plan, setPlan] = useState("100");
  const planPrice = Number(plan) || 0;

  const planWins = monthlySpend >= planPrice;
  const diff = Math.abs(monthlySpend - planPrice);
  const multipleToBreakEven =
    monthlySpend > 0 ? planPrice / monthlySpend : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">
            Your typical monthly usage (API-equivalent)
          </p>
          <p className="tabnum mt-0.5 text-lg font-semibold">
            {formatCurrency(monthlySpend)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">
            Flat plan price / month
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                aria-label="Flat plan price"
                className="pl-7"
              />
            </div>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPlan(String(p))}
                >
                  ${p}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border p-4 text-sm",
          planWins
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5",
        )}
      >
        {planWins ? (
          <p>
            <span className="font-medium">A flat plan pays off.</span> At your
            usage, a {formatCurrency(planPrice)}/mo plan would save about{" "}
            <span className="text-success font-medium">
              {formatCurrency(diff)}/mo
            </span>{" "}
            versus pay-as-you-go.
          </p>
        ) : (
          <p>
            <span className="font-medium">Pay-as-you-go wins for now.</span> The
            plan costs about{" "}
            <span className="text-warning font-medium">
              {formatCurrency(diff)}/mo
            </span>{" "}
            more than your usage.
            {multipleToBreakEven != null
              ? ` You'd need roughly ${multipleToBreakEven.toFixed(1)}× your current usage to break even.`
              : " Log a few sessions with cost estimates to compare."}
          </p>
        )}
      </div>
    </div>
  );
}
