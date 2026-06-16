"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { DeleteAction } from "@/components/delete-action";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export function RowActions({
  editHref,
  onDelete,
  name,
  entityLabel,
  redirectTo,
}: {
  editHref: string;
  onDelete: () => Promise<ActionResult<unknown>>;
  name: string;
  entityLabel: string;
  redirectTo?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${entityLabel}`}
        render={<Link href={editHref} />}
      >
        <Pencil />
      </Button>
      <DeleteAction
        entityLabel={entityLabel}
        name={name}
        action={onDelete}
        redirectTo={redirectTo}
        trigger={(open) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${entityLabel}`}
            onClick={open}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        )}
      />
    </div>
  );
}
