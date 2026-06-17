# ModelBench Journal

A personal command center for tracking the **real value** of AI models and tools
across coding, writing, research, debugging, UI work and product thinking — not
vanity metrics like token counts. Log each meaningful AI session, score it, and
the app tells you which model/tool actually saves time, which wastes it, which is
worth its quota, and when a flagship model beats a cheaper one.

> Status: `current`. Solo, personal-use app. Dark, premium dashboard UI.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-ui primitives)
- **Drizzle ORM** + **PostgreSQL** (Neon-ready, via `postgres-js`)
- **better-auth** (email/password, per-user data)
- **React Hook Form** + **Zod 4** (Standard Schema resolver)
- **Recharts** for charts, **date-fns**, **lucide-react**

## Getting started

```bash
pnpm install

# 1. Configure env: DATABASE_URL + a BETTER_AUTH_SECRET
cp .env.example .env
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 2. Create the schema
pnpm db:migrate               # or: pnpm db:push

# 3. Load the demo account + realistic sample data
pnpm db:seed

# 4. Run it
pnpm dev                      # http://localhost:3000
```

Then sign up for a fresh empty workspace, or click **Explore the demo** on the
login screen to browse the seeded data.

Any PostgreSQL-compatible database works. For **Neon**, use the *pooled*
connection string. The app reads `DATABASE_URL` and connects lazily, so it
builds fine without a database — but pages need one at runtime.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm db:push` | Push the schema to the database |
| `pnpm db:migrate` | Apply migrations in `db/migrations` |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed` | Reset + load sample data |

## Features

- **Dashboard** — KPIs (sessions, net time saved, cost, avg quality) over a
  **global date range** with previous-period deltas, a **budget alert**, best
  model by quality and cost-value, **computed signals**, an **activity heatmap +
  streaks**, usage donut, score/reliability trend, time saved vs spent,
  cost-vs-quality scatter, top models, and sessions to review.
- **Recommend** — a "what should I use?" engine that ranks models/tools per task
  type and goal (balanced / quality / budget) from your own results, weighted by
  how much evidence backs each pick, with plain-English rationale. The new-session
  form also suggests your strongest model for the chosen task type.
- **Sessions** — filterable/searchable table, rich create/edit form with **fast
  presets**, inline failure patterns, **token-based cost** (auto-computed from the
  model's pricing), and a detailed session view.
- **Models / Tools / Projects** — full CRUD, per-entity dashboards, and compare
  leaderboards. Models add a **head-to-head A-vs-B comparison** (radar overlay,
  stat deltas, per-task breakdown, quality verdict) and a one-click **catalog
  import** of current models with pricing.
- **Insights** — durable observations linked to a model/tool/project, plus
  **suggested insights** the app derives from your data (one click to save).
- **Reports** — weekly review, model rankings, best model by task type, failure
  heatmap, "is the strong model worth it?", and a **Cost & budget** tab (spend
  trends, projection, budget progress, subscription break-even). Analytical tabs
  follow the global date range.
- **Confidence-aware rankings** — every leaderboard shows sample size, a
  confidence dot and quality spread, and a Wilson-bounded success rate so small
  samples can't masquerade as authoritative.
- **Data** — JSON backup export/import (non-destructive) and sessions CSV export.
- **Cmd/Ctrl+K** command palette for quick search, create and navigation.

## Calculated metrics (`lib/metrics`)

- **Net time saved** = `estimatedTimeSavedMinutes − timeSpentMinutes`
- **Cost-value index** = `qualityScore / estimatedCostUsd` (free → high, unknown → excluded)
- **Reliability index (0–100)** — blends result status, human intervention, test
  outcomes, regressions and follow-up needs.
- **Worth-it verdict** — Definitely worth it / Good enough / Too expensive /
  Avoid for this task.
- **Confidence** — sample-size level (low/med/high), quality std-dev, and a
  Wilson lower-bound success rate, used to keep rankings honest.
- **Recommendation fit (0–100)** — confidence-shrunk blend of quality,
  reliability, cost-value and net time, tuned per goal (`recommend.ts`).
- **Signals** — derived observations: model regressions/improvements, most
  reliable pick, low-value spend, recurring failures, weak task types
  (`signals.ts`).
- **Token cost** = `inputTokens·inRate + outputTokens·outRate` from model pricing
  (`pricing.ts`).

## Project structure

```
app/            routes, server actions, route handlers (api/export/*)
components/     ui (shadcn), charts/, forms/, tables/, filters/, layout/
db/             schema.ts, index.ts (client), queries/, migrations/
lib/            metrics/, validations/, constants, format, normalize, nav
seed/           sample data (pnpm db:seed)
types/          shared types
```

## Authentication

Email/password auth via **better-auth**, with per-user data isolation
(`ownerId` on every entity; all queries and actions are scoped to the signed-in
user).

- **Sign up** creates a fresh, empty workspace.
- **Explore the demo** signs into a shared demo account that owns the seed data.
- **Forgot/reset password** works out of the box — with `RESEND_API_KEY` set the
  reset link is emailed, otherwise it's printed to the server console.
- **Change password** lives on the Account page (revokes other sessions).
- **Monthly budget** is set on the Account page and drives the dashboard budget
  alert and the Reports → Cost & budget tab.

Routes are guarded by `proxy.ts` (optimistic redirect) plus server-side
`requireUserId` checks in every query/action. `pnpm db:seed` creates the demo
account (`lib/demo.ts`) and assigns all sample data to it.

## Agent ingestion (draft sessions)

Instead of typing every session, let an agent log it for you. Generate a token
on the **Account** page, then have your agent `POST` a session to the ingest
endpoint — it lands as a **draft** you review and confirm (drafts are excluded
from all analytics until confirmed).

```bash
curl -X POST "$BETTER_AUTH_URL/api/sessions/ingest" \
  -H "Authorization: Bearer <your-ingest-token>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Refactor checkout", "tool": "Claude Code",
        "model": "Opus 4.8", "project": "SmartTrips", "taskType": "refactor",
        "resultStatus": "good", "timeSpentMinutes": 35,
        "estimatedTimeSavedMinutes": 150, "estimatedCostUsd": 0.9,
        "qualityScore": 8, "tags": ["rsc"] }'
```

- Relations (`tool` / `model` / `project` / `followupModel`) are matched by name
  for your account; unknown names are left unlinked.
- Enums are forgiving (bad values fall back to a sensible default); only `title`
  is required.
- Optional `inputTokens` / `outputTokens` are stored, and when
  `estimatedCostUsd` is omitted the cost is computed from the matched model's
  pricing.
- On a **subscription** plan there's no real per-task dollar cost, so set
  `estimatedCostUsd` to the *notional* API-equivalent cost (e.g. what
  [`ccusage`](https://ccusage.com) computes from tokens) and use `quotaFeeling`
  for subscription pressure. Per-session cost/usage is available from Claude
  Code (`/cost`, OpenTelemetry, `ccusage`) and Codex (`/status`, `ccusage`).

A good workflow: a `SessionEnd` hook runs `ccusage` for the cost + an evaluator
prompt (ideally a *different* model than the one that did the work) to draft the
scores, then POSTs to the endpoint.
