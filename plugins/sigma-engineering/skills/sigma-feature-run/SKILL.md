---
name: sigma-feature-run
description: >-
  Sigma's standard for running a feature end-to-end across tiered Claude models
  with delegated verification, recon and review-gathering. Use this skill
  whenever the user starts, plans, executes, verifies or reviews a feature run;
  whenever they mention orchestration, subagents, agent tiers, model routing,
  effort levels, context budget, or "which model should do this"; and whenever a
  task is large enough to span planning, implementation and verification in one
  session — even if they don't say the word "orchestration". Also use it when
  triaging CI logs or gathering PR review comments back into a session.
---

# Sigma Feature Run

The house standard for running a feature across model tiers without burning the
main session's context or overpaying for mechanical work.

## Operating principles

1. **Capability flows down, evidence flows up.** Planning and judgement sit at
   the top tier. Reading, running and summarising sit at the bottom. Nothing
   below the author's tier is allowed to sign off on the author's design.
2. **Deterministic beats probabilistic.** If a shell command answers the
   question, run the shell command. Delegate to a model only when the
   compression needs judgement.
3. **The main session holds decisions, not transcripts.** Raw logs, greps, file
   tours and comment threads belong in a subagent's context and never in yours.
4. **Two dials, not one.** Class and effort are independent. Try dropping effort
   before dropping a class.
5. **Prompt to the tier.** Instructions that help one class hurt another —
   verification scaffolding, show-your-reasoning language and delegation caps
   all invert across the range. `references/prompting.md` is not optional
   reading before authoring a prompt.
6. **Idempotent.** Every mode below can be re-entered on a half-finished run
   without redoing completed work. Check state before acting.

## Modes

Route on the user's intent. If unstated, infer from repo state and say which
mode you picked.

| Mode | Trigger | Tier |
| --- | --- | --- |
| `plan` | New feature, no plan artefact exists | Top (Fable / Opus, high effort) |
| `execute` | Plan exists, work not complete | Mid (Sonnet), escalating on block |
| `verify` | Diff exists, needs proof it works | Bottom (Haiku) + shell |
| `review` | Verified diff, needs judgement | Author's tier or above |
| `gather` | Review comments or CI failures exist upstream | Bottom (Haiku) |
| `report` | End of run | Current session |

### plan

Produce a written plan before any code. The plan is the artefact the rest of the
run is measured against, so this is where top-tier capability earns its price.

Required output: task breakdown with file paths, the seam being changed,
explicit non-goals, and **verifiable acceptance criteria per task** — criteria a
Haiku-tier verifier can check without judgement. If you can't state a criterion
that way, the task isn't decomposed yet.

Write it to `docs/plans/<feature>.md`. If it already exists, read it and resume
rather than regenerating.

### execute

Work the plan task by task. Prefer executing at mid tier and escalating when
stuck over running the whole implementation at top tier — see
`references/tiering.md` for the escalation triggers and the advisor pattern.

Delegate any read-heavy detour (tracing a call path, finding every caller,
touring an unfamiliar module) to a recon subagent — `agents/recon.md`. You take
its findings, not its transcript.

After each task, run `verify` before moving to the next. Do not batch.

### verify

Deterministic first, always:

```
<test command> ; <typecheck> ; <lint> ; <build>
```

Read exit codes yourself. Delegate to `agents/verifier.md` only when output
needs judgement to compress — clustering many failures into root causes,
separating flaky from real, or triaging a long CI log. Return contract is in
`references/return-contracts.md`.

Never accept "tests pass" without the command's exit code in evidence.

**Tier-conditional, and the tiers genuinely disagree here.** Running the suite
and triaging its output is deterministic work worth delegating at any tier.
Asking a model to re-check its own reasoning is not, and on Opus 5 it actively
wastes tokens — that model self-corrects well and explicit verification
instructions compound with behaviour it already has. On Fable's long autonomous
runs the opposite holds: separate fresh-context verifier subagents outperform
self-critique. Route on tier, not on habit. See `references/prompting.md`.

### review

Two distinct passes, and they do not merge:

- **Spec compliance** — does this diff do what the plan said, no more, no less?
  Mid tier is fine. Mechanical comparison against the plan's acceptance criteria.
- **Judgement review** — right abstraction, missed edge cases, seam correctness,
  failure modes. Author's tier or above, never below.

If the same tier authored and judgement-reviewed in one session, say so in the
report. That's a known weak spot, not a silent one.

### gather

Pull PR comments, CI failures or review threads into a compressed brief. Use
`agents/review-gatherer.md`. Findings must arrive grouped by file with thread
status (resolved / unresolved / author-replied) and permalinks back to source.

### report

Close the run with: what shipped, what was verified and by which command, what
was reviewed and at which tier, open threads, and anything a subagent flagged as
truncated. Keep it under a screen.

## Escalation and stop conditions

Stop and hand back to the user when:

- The plan's acceptance criteria turn out not to be checkable — the
  decomposition is wrong, and continuing compounds it.
- Verification fails three times on the same task. Three failures is a design
  signal, not a retry signal.
- A subagent reports truncation on evidence that matters to a decision.
- The change touches auth, payments, data migration, or anything irreversible —
  those get human review regardless of how clean the verification looked.

## Reference files

- `references/tiering.md` — class/effort matrix, escalation triggers, advisor
  pattern, when a subagent is worth its context window.
- `references/prompting.md` — per-model prompting guidance and cross-model
  comparison chart, including legacy Opus builds. Read before writing any prompt
  that will run on a specific tier.
- `references/return-contracts.md` — required return schemas for delegated work.
- `agents/recon.md`, `agents/verifier.md`, `agents/review-gatherer.md` —
  subagent definitions. Drop into `.claude/agents/` to make them dispatchable.
- `prompts/feature-run.prompt.md` — the executable entry point.
- `prompts/orchestration-eval.prompt.md` — harness for measuring whether a tier
  configuration is actually cheaper. Run before standardising any change to the
  matrix.
