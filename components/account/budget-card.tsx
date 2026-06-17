"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMonthlyBudget } from "@/app/account/actions";

export function BudgetCard({ initial }: { initial: number | null }) {
  const [value, setValue] = useState(initial == null ? "" : String(initial));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.error("Enter a valid amount.");
      return;
    }
    startTransition(async () => {
      const res = await setMonthlyBudget(parsed);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setValue(res.data.value == null ? "" : String(res.data.value));
      toast.success(
        res.data.value == null ? "Budget cleared." : "Budget saved.",
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Set a monthly spend target. ModelBench warns you on the dashboard when
        you&apos;re tracking over it, and shows progress in Reports → Cost &amp;
        budget. Leave blank to disable.
      </p>
      <div className="flex items-end gap-2">
        <div className="relative w-48">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            $
          </span>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="decimal"
            placeholder="e.g. 50"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Monthly budget in USD"
            className="pl-7"
          />
        </div>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}
