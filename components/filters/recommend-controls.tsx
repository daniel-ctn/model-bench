"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";

import { SelectField } from "@/components/select-field";
import type { Option } from "@/lib/constants";

/** Two URL-backed selects (task type + goal) driving the recommendations page. */
export function RecommendControls({
  taskOptions,
  goalOptions,
}: {
  taskOptions: Option[];
  goalOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const set = (param: string, value: string, fallback: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value === fallback) next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Target className="text-muted-foreground size-4" />
        <div className="w-52">
          <SelectField
            size="sm"
            value={sp.get("task") ?? "all"}
            onValueChange={(v) => set("task", v, "all")}
            options={taskOptions}
          />
        </div>
      </div>
      <div className="w-48">
        <SelectField
          size="sm"
          value={sp.get("goal") ?? "balanced"}
          onValueChange={(v) => set("goal", v, "balanced")}
          options={goalOptions}
        />
      </div>
    </div>
  );
}
