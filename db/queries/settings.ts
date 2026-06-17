import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";

/** The signed-in user's monthly spend target (USD), or null if unset. */
export async function getMonthlyBudget(): Promise<number | null> {
  const userId = await requireUserId();
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { monthlyBudgetUsd: true },
  });
  return row?.monthlyBudgetUsd ?? null;
}
