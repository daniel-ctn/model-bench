# Manual session-eval prompts

Two variants, both mapping to the ModelBench **New session** form (cost omitted):

1. **Self-eval** — paste at the end of the session in the *same* tool that did
   the work (it uses its own transcript).
2. **Cross-eval (recommended)** — run in the *other* tool (e.g. Codex reviews a
   Claude Code task, and vice-versa) for an unbiased grade. The reviewer wasn't
   there, so it inspects the `git diff`/tests itself.

> Tip (Claude Code): save a prompt as `.claude/commands/eval.md` → run `/eval`.

## Cross-eval (recommended)

```text
A different AI coding tool just completed a task in THIS repository. Act as a
skeptical, independent reviewer and evaluate its work for my "ModelBench"
journal. You did NOT do this work — judge the actual artifacts, not any claims,
and don't be generous. Ignore cost.

First, inspect what changed yourself:
- Run `git diff` and `git diff --stat`; if it was committed, also `git show HEAD`.
- Read the key changed files. If tests exist and are quick to run, run them.

Context I'm giving you:
- Task requested: <ONE LINE describing what the other tool was asked to do>
- Tool that did it: <Claude Code | Codex | Cursor | ChatGPT>
- Model it used: <e.g. Opus 4.8, GPT-5.5, Sonnet 4.6>
- Its own summary (optional): <paste the other tool's summary, or omit>

Then print exactly these fields (use the allowed values; these describe the TOOL
THAT DID THE WORK, given above):

Title: <short imperative summary of the task>
Tool: <the doer from above>
Model: <the doer's model from above>
Task type: <frontend-ui|frontend-state|backend-api|database|auth|refactor|debugging|testing|architecture|product-thinking|writing|research|marketing|image-generation|video-generation|other>
Workflow: <one-shot|iterative-chat|agent-autonomous|pair-programming|code-review|research-assistant|writing-assistant|other>
Result: <excellent|good|usable-with-edits|poor|failed>
Human intervention: <none|light-review|moderate-edits|heavy-rewrite|abandoned>
Quota feeling: <cheap|fair|expensive|quota-heavy|unknown>
Time spent (min): <your best estimate>
Est. time saved (min): <honest estimate vs a human doing it>
Tests run: <yes/no>   Tests passed: <yes/no/n-a>
Caused regression: <yes/no — say yes if the diff likely broke something>

Scores — 1 to 10 based on the DIFF, or "N/A" if not applicable:
- Quality:
- Speed:
- Intent understanding:
- Code quality:
- UI taste:
- Reliability:
- Cost value:

Prompt summary: <what was asked>
Output summary: <what the diff actually delivers>
What worked: <grounded in the diff>
What failed: <grounded in the diff — be specific>
What I'd do differently:
Tags: <comma-separated, lowercase>

Failure patterns — only real ones you can see in the diff (else "none"), one per line:
  <misunderstood-intent|hallucinated-api|bad-ui-taste|broke-existing-code|over-engineered|under-engineered|ignored-instructions|too-verbose|poor-debugging|weak-tests|bad-refactor|other> | <low|medium|high> | <what happened> | <possible fix>

Keep it concise. No cost figure.
```

## Self-eval (same tool that did the work)

---

```text
You just finished a work session with me. Evaluate it honestly for my "ModelBench"
journal and print the result so I can log it. Base everything ONLY on what actually
happened this session — what I asked, the files you changed, tests, and the outcome.
Be critical: do not inflate the scores. Ignore cost entirely.

Print exactly these fields (use the allowed values shown):

Title: <short imperative summary>
Tool: <Claude Code | Codex | Cursor | ChatGPT — whichever you are>
Model: <the model you ran as, matching my ModelBench names e.g. Opus 4.8, GPT-5.5, Sonnet 4.6>
Task type: <frontend-ui|frontend-state|backend-api|database|auth|refactor|debugging|testing|architecture|product-thinking|writing|research|marketing|image-generation|video-generation|other>
Workflow: <one-shot|iterative-chat|agent-autonomous|pair-programming|code-review|research-assistant|writing-assistant|other>
Result: <excellent|good|usable-with-edits|poor|failed>
Human intervention: <none|light-review|moderate-edits|heavy-rewrite|abandoned>
Quota feeling: <cheap|fair|expensive|quota-heavy|unknown>
Time spent (min): <your wall-clock estimate>
Est. time saved (min): <honest estimate vs me doing it by hand>
Tests run: <yes/no>   Tests passed: <yes/no/n-a>
Caused regression: <yes/no>

Scores — 1 to 10, or "N/A" if not applicable to this task:
- Quality:
- Speed:
- Intent understanding:
- Code quality:
- UI taste:
- Reliability:
- Cost value:

Prompt summary: <1–2 lines: what I asked for>
Output summary: <1–2 lines: what you produced>
What worked: <1–2 lines>
What failed: <1–2 lines, honest>
What I'd do differently: <1–2 lines>
Tags: <comma-separated, lowercase>

Failure patterns — list only real ones (else write "none"), one per line as:
  <misunderstood-intent|hallucinated-api|bad-ui-taste|broke-existing-code|over-engineered|under-engineered|ignored-instructions|too-verbose|poor-debugging|weak-tests|bad-refactor|other> | <low|medium|high> | <what happened> | <possible fix>

Keep it concise. Do not include any cost figure.
```

---

Field values match the form's selects exactly, so you can pick them straight from
the dropdowns. `quality` is required; the other six scores are optional (leave
blank / "N/A"). `Model`, `Tool` and `Project` are matched by name.
