"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function DeleteAction({
  action,
  entityLabel = "item",
  name,
  redirectTo,
  trigger,
}: {
  /** A server action (typically `deleteX.bind(null, id)`). */
  action: () => Promise<ActionResult<unknown>>;
  entityLabel?: string;
  name?: string;
  redirectTo?: string;
  /** Render prop receiving an `open()` callback to wire any trigger element. */
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () => {
    startTransition(async () => {
      const res = await action();
      if (!res?.ok) {
        toast.error(res?.error ?? "Could not delete.");
        return;
      }
      toast.success(`${entityLabel} deleted.`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  return (
    <>
      {trigger(() => setOpen(true))}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              {name ? (
                <>
                  <span className="text-foreground font-medium">“{name}”</span>{" "}
                  will be permanently removed.{" "}
                </>
              ) : (
                "This item will be permanently removed. "
              )}
              This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
