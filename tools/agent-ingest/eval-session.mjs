#!/usr/bin/env node
// @ts-nocheck
/**
 * ModelBench session auto-logger.
 *
 * Reads an agent session transcript (Claude Code or Codex), computes a notional
 * cost via `ccusage`, asks a *separate* evaluator model to draft the scores and
 * reflection, and POSTs the result as a DRAFT to ModelBench's ingest endpoint.
 *
 * Usage:
 *   - Claude Code SessionEnd hook:  node eval-session.mjs        (reads stdin)
 *   - Codex (latest session):       node eval-session.mjs --codex
 *   - Manual:                       node eval-session.mjs --transcript <path> --tool "Codex"
 *   - Skip the LLM eval:            ... --no-eval
 *   - Print payload, don't send:    ... --dry-run
 *
 * Env:
 *   MODELBENCH_URL          (default http://localhost:3000)
 *   MODELBENCH_TOKEN        (required to POST; from the Account page)
 *   MODELBENCH_EVAL_CMD     (evaluator CLI, default "claude")
 *   MODELBENCH_EVAL_MODEL   (optional model id passed to the evaluator)
 *   MODELBENCH_PROJECT      (default project name; otherwise the cwd folder name)
 *   MODELBENCH_SKIP         (internal recursion guard)
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

// Prevent infinite recursion: the evaluator spawns `claude`, which would fire
// SessionEnd again. The evaluator runs with MODELBENCH_SKIP=1.
if (process.env.MODELBENCH_SKIP) process.exit(0);

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const flagVal = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const TASK_TYPES = ["frontend-ui", "frontend-state", "backend-api", "database", "auth", "refactor", "debugging", "testing", "architecture", "product-thinking", "writing", "research", "marketing", "image-generation", "video-generation", "other"];
const WORKFLOW_TYPES = ["one-shot", "iterative-chat", "agent-autonomous", "pair-programming", "code-review", "research-assistant", "writing-assistant", "other"];
const RESULT_STATUSES = ["excellent", "good", "usable-with-edits", "poor", "failed"];
const QUOTA_FEELINGS = ["cheap", "fair", "expensive", "quota-heavy", "unknown"];
const INTERVENTION_LEVELS = ["none", "light-review", "moderate-edits", "heavy-rewrite", "abandoned"];
const FAILURE_TYPES = ["misunderstood-intent", "hallucinated-api", "bad-ui-taste", "broke-existing-code", "over-engineered", "under-engineered", "ignored-instructions", "too-verbose", "poor-debugging", "weak-tests", "bad-refactor", "other"];

const warn = (...a) => console.error("[modelbench]", ...a);

function readStdin() {
  if (process.stdin.isTTY) return "";
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/* --------------------------- locate the transcript ------------------------- */

function latestCodexRollout() {
  const dir = join(homedir(), ".codex", "sessions");
  if (!existsSync(dir)) return null;
  let best = null;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/rollout.*\.jsonl$/.test(entry.name)) {
        const m = statSync(p).mtimeMs;
        if (!best || m > best.m) best = { p, m };
      }
    }
  };
  try {
    walk(dir);
  } catch {
    /* ignore */
  }
  return best?.p ?? null;
}

let stdinData = {};
let transcriptPath = flagVal("--transcript");
let cwd = process.cwd();
let sessionId = "";
let tool = flagVal("--tool");

if (!transcriptPath && !hasFlag("--codex")) {
  const raw = readStdin();
  if (raw.trim()) {
    try {
      stdinData = JSON.parse(raw);
      transcriptPath = stdinData.transcript_path;
      cwd = stdinData.cwd || cwd;
      sessionId = stdinData.session_id || "";
      tool = tool || "Claude Code";
    } catch {
      /* not a hook payload */
    }
  }
}
if (hasFlag("--codex")) {
  transcriptPath = transcriptPath || latestCodexRollout();
  tool = tool || "Codex";
}
tool = tool || "Claude Code";

if (!transcriptPath || !existsSync(transcriptPath)) {
  warn("no transcript found; nothing to log.");
  process.exit(0);
}
if (!sessionId) sessionId = basename(transcriptPath).replace(/\.jsonl$/, "");

/* ------------------------------ parse transcript --------------------------- */

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b) =>
        typeof b === "string"
          ? b
          : b?.type === "text" || b?.text
            ? (b.text ?? "")
            : "",
      )
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

const userTexts = [];
const assistantTexts = [];
const modelCounts = {};
const timestamps = [];

for (const line of readFileSync(transcriptPath, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }
  if (row.timestamp) {
    const t = Date.parse(row.timestamp);
    if (!Number.isNaN(t)) timestamps.push(t);
  }
  // Claude Code shape
  const msg = row.message ?? row.payload ?? row;
  const role = row.type === "user" || msg?.role === "user" ? "user" : msg?.role;
  const content = msg?.content ?? row.content ?? row.text;
  const text = textFromContent(content).trim();
  const model = msg?.model || row.model;
  if (model) modelCounts[model] = (modelCounts[model] ?? 0) + 1;
  if (!text) continue;
  if (role === "user") userTexts.push(text);
  else if (role === "assistant" || msg?.role === "assistant") assistantTexts.push(text);
}

const modelId =
  Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
const durationMin =
  timestamps.length >= 2
    ? Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000))
    : 0;
const firstPrompt = userTexts.find((t) => !t.startsWith("<")) ?? userTexts[0] ?? "";
const lastOutput = assistantTexts[assistantTexts.length - 1] ?? "";

/* --------------------------------- git diff -------------------------------- */

function gitDiffStat() {
  try {
    const r = spawnSync("git", ["-C", cwd, "diff", "--stat", "HEAD"], {
      encoding: "utf8",
      timeout: 8000,
    });
    return (r.stdout || "").trim().slice(0, 2000);
  } catch {
    return "";
  }
}
const diffStat = gitDiffStat();

/* ----------------------------------- cost ---------------------------------- */

function ccusageCost() {
  const sub = tool.toLowerCase().includes("codex")
    ? ["codex", "session", "--json"]
    : ["session", "--json"];
  try {
    const r = spawnSync("ccusage", sub, { encoding: "utf8", timeout: 30000 });
    if (r.status !== 0 || !r.stdout) return null;
    const data = JSON.parse(r.stdout);
    const list = Array.isArray(data) ? data : (data.sessions ?? data.data ?? []);
    const match = list.find((s) => {
      const id = s.sessionId ?? s.session ?? s.id ?? s.sessionId;
      return id && (id === sessionId || String(id).includes(sessionId) || sessionId.includes(String(id)));
    });
    const cost = match?.totalCost ?? match?.cost ?? null;
    return typeof cost === "number" ? Math.round(cost * 10000) / 10000 : null;
  } catch {
    return null;
  }
}
const estimatedCostUsd = ccusageCost();

/* -------------------------------- evaluator -------------------------------- */

function runEvaluator() {
  if (hasFlag("--no-eval")) return {};
  const cmd = process.env.MODELBENCH_EVAL_CMD || "claude";
  const prompt = `You are a critical, honest reviewer logging an AI coding session into a journal.
Read the session context and output ONLY a single minified JSON object (no markdown, no prose) with these keys:
- title: short imperative title
- taskType: one of ${TASK_TYPES.join("|")}
- workflowType: one of ${WORKFLOW_TYPES.join("|")}
- resultStatus: one of ${RESULT_STATUSES.join("|")}
- humanInterventionLevel: one of ${INTERVENTION_LEVELS.join("|")}
- quotaFeeling: one of ${QUOTA_FEELINGS.join("|")}
- qualityScore: integer 1-10
- speedScore, intentUnderstandingScore, codeQualityScore, uiTasteScore, reliabilityScore, costValueScore: integer 1-10 or null (null if not applicable)
- estimatedTimeSavedMinutes: integer (your honest estimate of minutes this saved a human)
- promptSummary, outputSummary, whatWorked, whatFailed, doDifferently: short strings
- tags: array of short strings
- failurePatterns: array of { type (one of ${FAILURE_TYPES.join("|")}), severity (low|medium|high), description, possibleFix }
Be skeptical: do not inflate scores. If the model broke things or needed heavy edits, say so.

SESSION CONTEXT
Tool: ${tool}
Model: ${modelId ?? "unknown"}
Duration (min): ${durationMin}
Notional cost (USD): ${estimatedCostUsd ?? "unknown"}
Git diff --stat:
${diffStat || "(no changes detected)"}

User prompts:
${userTexts.slice(0, 6).map((t) => `- ${t.slice(0, 500)}`).join("\n").slice(0, 4000)}

Final assistant message:
${lastOutput.slice(0, 3000)}`;

  try {
    const r = spawnSync(cmd, buildEvalArgs(prompt), {
      encoding: "utf8",
      timeout: 120000,
      env: { ...process.env, MODELBENCH_SKIP: "1" },
    });
    const out = (r.stdout || "").trim();
    return extractJson(out) ?? {};
  } catch (e) {
    warn("evaluator failed:", e?.message ?? e);
    return {};
  }
}

function buildEvalArgs(prompt) {
  const a = ["-p", prompt, "--output-format", "text"];
  if (process.env.MODELBENCH_EVAL_MODEL) a.push("--model", process.env.MODELBENCH_EVAL_MODEL);
  return a;
}

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const evaluation = runEvaluator();

/* --------------------------------- payload --------------------------------- */

const project =
  flagVal("--project") ||
  process.env.MODELBENCH_PROJECT ||
  (cwd ? basename(cwd) : undefined);

const payload = {
  ...evaluation,
  title: evaluation.title || firstPrompt.slice(0, 120) || "AI session",
  tool,
  model: evaluation.model || modelId || undefined,
  project,
  timeSpentMinutes: durationMin || evaluation.timeSpentMinutes || 0,
  estimatedCostUsd: estimatedCostUsd ?? evaluation.estimatedCostUsd ?? null,
  promptSummary: evaluation.promptSummary || firstPrompt.slice(0, 600) || undefined,
  outputSummary: evaluation.outputSummary || lastOutput.slice(0, 600) || undefined,
};
// Drop undefined keys for a clean payload.
for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];

if (hasFlag("--dry-run")) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

/* ---------------------------------- send ----------------------------------- */

const url = (process.env.MODELBENCH_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.MODELBENCH_TOKEN;
if (!token) {
  warn("MODELBENCH_TOKEN not set; printing payload instead of sending.");
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

try {
  const res = await fetch(`${url}/api/sessions/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok && body.ok) {
    console.log(`[modelbench] draft logged → ${body.reviewUrl}`);
  } else {
    warn("ingest failed:", res.status, body.error ?? "");
  }
} catch (e) {
  warn("could not reach ModelBench:", e?.message ?? e);
}
process.exit(0);
