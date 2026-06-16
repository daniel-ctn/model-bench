import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Connection string for any PostgreSQL-compatible database (Neon, Supabase,
 * local Postgres). `postgres-js` connects lazily on first query, so importing
 * this module never throws even when DATABASE_URL is unset (e.g. during build).
 */
const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/modelbench";

// Reuse a single client across hot-reloads in development to avoid exhausting
// connections. `prepare: false` keeps things compatible with pooled poolers
// such as Neon's PgBouncer.
const globalForDb = globalThis as unknown as {
  __mbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__mbClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mbClient = client;
}

export const db = drizzle(client, { schema });

export { schema };
