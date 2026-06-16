"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { zodFormResolver } from "@/lib/resolver";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");

  const form = useForm<ResetPasswordValues>({
    resolver: zodFormResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) return;
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      toast.error(error.message ?? "Could not reset your password.");
      return;
    }
    toast.success("Password updated. Please sign in.");
    router.push("/login");
  });

  if (!token || error) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-sm">This reset link is invalid or has expired.</p>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/forgot-password" />}
        >
          Request a new link
        </Button>
      </div>
    );
  }

  const pending = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          name="password"
          label="New password"
          type="password"
          description="At least 8 characters."
        />
        <TextField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Reset password
        </Button>
      </form>
    </FormProvider>
  );
}
