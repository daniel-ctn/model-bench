"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "./app-shell";

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * Renders the full app shell for authenticated pages, but bare children for the
 * auth pages (login/signup/etc.) which have their own centered layout.
 */
export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  if (isAuthRoute) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
