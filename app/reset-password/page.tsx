import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your account."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
