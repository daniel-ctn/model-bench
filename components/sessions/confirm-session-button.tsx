"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmSession } from "@/app/sessions/actions";

export function ConfirmSessionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () =>
    startTransition(async () => {
      const res = await confirmSession(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Session confirmed.");
      router.refresh();
    });

  return (
    <Button size="sm" onClick={confirm} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      Confirm
    </Button>
  );
}
