"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { importBackup } from "@/app/data/actions";

export function DataImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    startTransition(async () => {
      const res = await importBackup(text);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        const c = res.data;
        toast.success(
          `Imported ${c.sessions} sessions, ${c.models} models, ${c.tools} tools, ${c.projects} projects, ${c.insights} insights.`,
        );
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFile}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Upload />}
        Import JSON
      </Button>
    </>
  );
}
