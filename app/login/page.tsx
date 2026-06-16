import { Suspense } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your ModelBench journal."
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
