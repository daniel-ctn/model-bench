import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start tracking what your AI tools are really worth."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
