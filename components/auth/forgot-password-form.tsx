"use client";

import Link from "next/link";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { zodFormResolver } from "@/lib/resolver";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodFormResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      toast.error(error.message ?? "Something went wrong.");
      return;
    }
    setSent(true);
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="bg-success/15 text-success flex size-10 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm">
          If an account exists for that email, a reset link is on its way.
        </p>
        <p className="text-muted-foreground text-xs">
          No email provider configured? The link is printed to the server
          console.
        </p>
        <Button variant="outline" size="sm" render={<Link href="/login" />}>
          Back to sign in
        </Button>
      </div>
    );
  }

  const pending = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Send reset link
        </Button>
      </form>
    </FormProvider>
  );
}
