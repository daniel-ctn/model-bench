# Manual session-eval prompt

Paste this at the **end of a Codex or Claude Code session** to get an honest
evaluation mapped to the ModelBench **New session** form fields, then type the
values in (or adapt to the ingest API). Cost is intentionally omitted.

> Tip (Claude Code): save the prompt below as `.claude/commands/eval.md` and run
> it with `/eval`.

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
