# Agent session auto-logger

Logs a **draft** ModelBench session at the end of an agent session: parses the
transcript, computes a notional cost via [`ccusage`](https://ccusage.com), asks a
**separate evaluator model** to draft the scores + reflection, and POSTs to
`/api/sessions/ingest`. You review and confirm in the app.

> Requires Node 18+. `ccusage` is optional (only used for cost). The evaluator
> uses the `claude` CLI by default — pick a *different/cheaper* model than the
> one that did the work to reduce self-grading bias.

## 1. Configure env

Get a token from the app's **Account → Agent ingestion** page.

```bash
export MODELBENCH_URL="http://localhost:3000"      # or your deployed URL
export MODELBENCH_TOKEN="mb_…"                      # from Account page
export MODELBENCH_EVAL_MODEL="claude-haiku-4-5"     # optional: cheaper/different
# export MODELBENCH_EVAL_CMD="claude"               # evaluator CLI (default)
# export MODELBENCH_PROJECT="SmartTrips"            # default project name
```

## 2a. Claude Code — SessionEnd hook

Add to `~/.claude/settings.json` (global, fires for every project) — adjust the
path:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /ABSOLUTE/PATH/model-bench/tools/agent-ingest/eval-session.mjs"
          }
        ]
      }
    ]
  }
}
```

The hook receives the transcript on stdin. A recursion guard
(`MODELBENCH_SKIP`) stops the evaluator's own `claude` call from re-triggering
the hook.

## 2b. Codex — after a session

Codex has no clean SessionEnd hook, so run it against the latest rollout:

```bash
node tools/agent-ingest/eval-session.mjs --codex --tool "Codex"
```

Or wire it to Codex's `notify` program in `~/.codex/config.toml`.

## Manual / testing

```bash
# Preview the payload without sending:
node tools/agent-ingest/eval-session.mjs --transcript <path.jsonl> --tool "Codex" --dry-run

# Objective-only (skip the evaluator LLM):
node tools/agent-ingest/eval-session.mjs --transcript <path.jsonl> --no-eval
```

## Behaviour & safety

- **Drafts only** — entries land as drafts (excluded from analytics) until you
  confirm them in the app.
- **Graceful degradation** — if `ccusage` is missing, cost is left blank; if the
  evaluator fails, it sends an objective-only draft. It never throws out of the
  hook (always exits 0).
- **Subscription cost** — `ccusage` reports the API-equivalent (notional) cost,
  which is what you want on a flat-rate plan; pair it with `quotaFeeling`.
- Relations (`tool`/`model`/`project`) are matched by name in the app; the
  evaluator is told the model id, so rename to your friendly model name (e.g.
  "Opus 4.8") on review if it doesn't match.
