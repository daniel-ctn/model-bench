import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { sendEmail } from "@/lib/email";

// In production a real secret is mandatory — the fallback would let anyone
// forge session cookies. In dev we keep a convenience fallback.
if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set in production (cookies are signed with it).",
  );
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-insecure-secret-change-me",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your ModelBench password",
        text: `Reset your ModelBench password by opening this link:\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    },
  },
  // nextCookies must be last so server actions can set auth cookies.
  plugins: [nextCookies()],
});
