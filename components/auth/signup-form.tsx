"use client";

import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { zodFormResolver } from "@/lib/resolver";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";

export function SignupForm() {
  const router = useRouter();
  const form = useForm<SignupValues>({
    resolver: zodFormResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? "Could not create your account.");
      return;
    }
    toast.success("Welcome to ModelBench!");
    router.push("/");
    router.refresh();
  });

  const pending = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField name="name" label="Name" placeholder="Ada Lovelace" />
        <TextField
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          description="At least 8 characters."
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </FormProvider>
  );
}
