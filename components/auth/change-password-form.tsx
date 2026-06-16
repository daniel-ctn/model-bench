"use client";

import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { zodFormResolver } from "@/lib/resolver";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validations/auth";

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodFormResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      toast.error(error.message ?? "Could not change your password.");
      return;
    }
    toast.success("Password updated.");
    form.reset();
  });

  const pending = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        className="flex max-w-md flex-col gap-4"
      >
        <TextField
          name="currentPassword"
          label="Current password"
          type="password"
        />
        <TextField
          name="newPassword"
          label="New password"
          type="password"
          description="At least 8 characters."
        />
        <TextField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
        />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </FormProvider>
  );
}
