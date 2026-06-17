"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Swords } from "lucide-react";

import { SelectField } from "@/components/select-field";
import type { Option } from "@/lib/constants";

/** Two URL-backed model pickers (a vs b) driving the head-to-head panel. */
export function VersusControls({ models }: { models: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const set = (param: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === "none") next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const options: Option[] = [{ value: "none", label: "Select a model…" }, ...models];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-44">
        <SelectField
          size="sm"
          value={sp.get("a") ?? "none"}
          onValueChange={(v) => set("a", v)}
          options={options}
        />
      </div>
      <Swords className="text-muted-foreground size-4" />
      <div className="w-44">
        <SelectField
          size="sm"
          value={sp.get("b") ?? "none"}
          onValueChange={(v) => set("b", v)}
          options={options}
        />
      </div>
    </div>
  );
}
