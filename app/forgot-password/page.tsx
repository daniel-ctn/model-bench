import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send a reset link."
      footer={
        <Link
          href="/login"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
