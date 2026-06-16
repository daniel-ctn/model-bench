"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function TagsInput({
  value,
  onChange,
  placeholder = "Add a tag and press Enter",
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = raw.trim().replace(/^#/, "");
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div
      className={cn(
        "border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex flex-wrap items-center gap-1.5 rounded-lg border bg-transparent p-1.5 transition-colors focus-within:ring-3",
      )}
    >
      {value.map((t) => (
        <span
          key={t}
          className="bg-muted text-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
        >
          #{t}
          <button
            type="button"
            onClick={() => remove(t)}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${t}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[10ch] flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}
