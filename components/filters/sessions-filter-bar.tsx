"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  resultStatusOptions,
  taskTypeOptions,
  type Option,
} from "@/lib/constants";
import type { FormLookups } from "@/db/queries/lookups";

const QUALITY_OPTIONS: Option[] = [
  { value: "all", label: "Any quality" },
  { value: "9", label: "9+ only" },
  { value: "8", label: "8+ only" },
  { value: "7", label: "7+ only" },
  { value: "5", label: "5+ only" },
];

const FAILURE_OPTIONS: Option[] = [
  { value: "all", label: "Any outcome" },
  { value: "1", label: "With failures" },
  { value: "0", label: "No failures" },
];

const withAll = (label: string, options: readonly Option[]): Option[] => [
  { value: "all", label },
  ...options,
];

export function SessionsFilterBar({ lookups }: { lookups: FormLookups }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  // Debounced sync of the search box into the URL.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      setParam("q", search.trim() || null);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const get = (key: string) => params.get(key) ?? "all";
  const projectOptions = withAll(
    "All projects",
    lookups.projects.map((p) => ({ value: p.id, label: p.name })),
  );
  const toolOptions = withAll(
    "All tools",
    lookups.tools.map((t) => ({ value: t.id, label: t.name })),
  );
  const modelOptions = withAll(
    "All models",
    lookups.models.map((m) => ({ value: m.id, label: m.shortName ?? m.name })),
  );

  const activeCount = [
    "q",
    "project",
    "tool",
    "model",
    "task",
    "result",
    "minq",
    "fail",
    "from",
    "to",
  ].filter((k) => params.get(k)).length;

  const clearAll = () => {
    setSearch("");
    router.replace(pathname, { scroll: false });
  };

  const sel = (key: string, value: string) =>
    setParam(key, value === "all" ? null : value);

  return (
    <div className="bg-card/40 flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search title, prompt, output, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="self-start sm:self-auto"
          >
            <X />
            Clear ({activeCount})
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <SelectField
          size="sm"
          value={get("project")}
          onValueChange={(v) => sel("project", v)}
          options={projectOptions}
        />
        <SelectField
          size="sm"
          value={get("tool")}
          onValueChange={(v) => sel("tool", v)}
          options={toolOptions}
        />
        <SelectField
          size="sm"
          value={get("model")}
          onValueChange={(v) => sel("model", v)}
          options={modelOptions}
        />
        <SelectField
          size="sm"
          value={get("task")}
          onValueChange={(v) => sel("task", v)}
          options={withAll("All tasks", taskTypeOptions)}
        />
        <SelectField
          size="sm"
          value={get("result")}
          onValueChange={(v) => sel("result", v)}
          options={withAll("All results", resultStatusOptions)}
        />
        <SelectField
          size="sm"
          value={get("minq")}
          onValueChange={(v) => sel("minq", v)}
          options={QUALITY_OPTIONS}
        />
        <SelectField
          size="sm"
          value={get("fail")}
          onValueChange={(v) => sel("fail", v)}
          options={FAILURE_OPTIONS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
          From
          <input
            type="date"
            value={params.get("from") ?? ""}
            onChange={(e) => setParam("from", e.target.value || null)}
            className="border-input bg-transparent dark:bg-input/30 h-7 rounded-md border px-2 text-sm"
          />
        </label>
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
          To
          <input
            type="date"
            value={params.get("to") ?? ""}
            onChange={(e) => setParam("to", e.target.value || null)}
            className="border-input bg-transparent dark:bg-input/30 h-7 rounded-md border px-2 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
