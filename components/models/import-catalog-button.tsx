"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { importCatalogModels } from "@/app/models/actions";

export function ImportCatalogButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () => {
    startTransition(async () => {
      const res = await importCatalogModels();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data.added === 0
          ? "You already have every catalog model."
          : `Added ${res.data.added} model${res.data.added === 1 ? "" : "s"} from the catalog.`,
      );
      router.refresh();
    });
  };

  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <PackagePlus />}
      Add from catalog
    </Button>
  );
}
