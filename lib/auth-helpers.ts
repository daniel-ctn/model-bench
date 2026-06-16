import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/** Cached per request so multiple queries share a single session lookup. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser() {
  const s = await getSession();
  return s?.user ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getSession())?.user?.id ?? null;
}

/** Returns the current user id, or redirects to /login when unauthenticated. */
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect("/login");
  return id;
}
