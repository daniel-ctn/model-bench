"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { SelectField } from "@/components/select-field";
import type { Option } from "@/lib/constants";

export function SortSelect({
  param = "sort",
  options,
}: {
  param?: string;
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const value = sp.get(param) ?? options[0].value;

  const onChange = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v === options[0].value) next.delete(param);
    else next.set(param, v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="text-muted-foreground size-4" />
      <div className="w-48">
        <SelectField
          size="sm"
          value={value}
          onValueChange={onChange}
          options={options}
        />
      </div>
    </div>
  );
}
