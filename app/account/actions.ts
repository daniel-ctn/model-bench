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

/** Set or clear the monthly spend target. Pass null to clear it. */
export async function setMonthlyBudget(
  value: number | null,
): Promise<ActionResult<{ value: number | null }>> {
  const userId = await requireUserId();
  const clean =
    value == null || !Number.isFinite(value) || value <= 0
      ? null
      : Math.round(value * 100) / 100;
  try {
    await db
      .update(user)
      .set({ monthlyBudgetUsd: clean })
      .where(eq(user.id, userId));
    revalidatePath("/account");
    revalidatePath("/reports");
    revalidatePath("/");
    return ok({ value: clean });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save budget.");
  }
}
