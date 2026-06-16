"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { requireUserId } from "@/lib/auth-helpers";

export async function generateIngestToken(): Promise<
  ActionResult<{ token: string }>
> {
  const userId = await requireUserId();
  try {
    const token = `mb_${randomBytes(24).toString("base64url")}`;
    await db.update(user).set({ ingestToken: token }).where(eq(user.id, userId));
    revalidatePath("/account");
    return ok({ token });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not generate a token.");
  }
}
