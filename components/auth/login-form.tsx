"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { zodFormResolver } from "@/lib/resolver";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const [demoLoading, setDemoLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodFormResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? "Could not sign in.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  });

  const loginDemo = async () => {
    setDemoLoading(true);
    const { error } = await authClient.signIn.email({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (error) {
      toast.error("Demo account isn't available. Run `pnpm db:seed`.");
      setDemoLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

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
        <div>
          <TextField name="password" label="Password" type="password" />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <div className="text-muted-foreground my-4 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        OR
        <span className="bg-border h-px flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={loginDemo}
        disabled={demoLoading}
      >
        {demoLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Explore the demo
      </Button>
    </FormProvider>
  );
}
