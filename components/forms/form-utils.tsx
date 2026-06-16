"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActionResult } from "@/lib/action-result";

/** Wires RHF submit → server action → toast / field errors / redirect. */
export function useEntitySubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  action: (values: T) => Promise<ActionResult<{ id: string }>>,
  redirectTo: (id: string) => string,
  successMessage = "Saved.",
) {
  const router = useRouter();
  return form.handleSubmit(async (values) => {
    const res = await action(values);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [key, messages] of Object.entries(res.fieldErrors)) {
          form.setError(key as Path<T>, { message: messages.join(", ") });
        }
      }
      toast.error(res.error);
      return;
    }
    toast.success(successMessage);
    router.push(redirectTo(res.data.id));
    router.refresh();
  });
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  );
}

export function FormBar({
  cancelHref,
  submitLabel,
  pending,
}: {
  cancelHref: string;
  submitLabel: string;
  pending: boolean;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-1">
      <div className="bg-card/95 flex items-center justify-end gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur">
        <Button type="button" variant="ghost" render={<Link href={cancelHref} />}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
