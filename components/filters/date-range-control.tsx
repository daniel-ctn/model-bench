"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { SelectField } from "@/components/select-field";
import { DEFAULT_RANGE, rangeOptions } from "@/lib/date-range";

/** URL-backed date-range picker. Writes the `range` param; default is omitted. */
export function DateRangeControl() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const value = sp.get("range") ?? DEFAULT_RANGE;

  const onChange = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v === DEFAULT_RANGE) next.delete("range");
    else next.set("range", v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarRange className="text-muted-foreground size-4" />
      <div className="w-44">
        <SelectField
          size="sm"
          value={value}
          onValueChange={onChange}
          options={rangeOptions}
        />
      </div>
    </div>
  );
}
