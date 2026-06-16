"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { DeleteAction } from "@/components/delete-action";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/app/sessions/actions";

export function SessionRowActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit session"
        render={<Link href={`/sessions/${id}/edit`} />}
      >
        <Pencil />
      </Button>
      <DeleteAction
        entityLabel="Session"
        name={title}
        action={deleteSession.bind(null, id)}
        trigger={(open) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete session"
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
