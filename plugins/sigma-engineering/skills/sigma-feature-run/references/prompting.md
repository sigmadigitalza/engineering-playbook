# Prompting by model

How to write for each model in the tier matrix, including the legacy Opus builds
still in circulation. Read this alongside `tiering.md` — that file decides
*which* model, this one decides *how to talk to it*.

## Contents

- Quick reference chart
- Fable 5 / Mythos 5
- Opus 5
- Opus 4.8
- Opus 4.7 and 4.6 (legacy)
- Sonnet 5
- Haiku 4.5
- The through-line

## Quick reference chart

| | Fable 5 | Opus 5 | Opus 4.8 | Opus 4.7 / 4.6 | Sonnet 5 | Haiku 4.5 |
| --- | --- | --- | --- | --- | --- | --- |
| **Thinking** | Adaptive, always on | Adaptive, on by default | Adaptive, **off** unless requested | Adaptive (4.7) / extended, deprecated (4.6) | Adaptive, on by default | Extended thinking, opt-in |
| **Effort default** | — set it | `high` on API & Claude Code | `high` all surfaces | — | `high` on API & Claude Code | n/a |
| **Recommended start** | `high`, `xhigh` when capability-sensitive | default `high`, `xhigh` for demanding agentic work | `xhigh` for coding/agentic, min `high` for intelligence-sensitive | as 4.8 | `high`; raise rather than prompt around shallowness | n/a |
| **Prompt style that wins** | Brief and general — state intent, let it work | Explicit scope, explicit narration shape | Explicit and literal; state scope broadly if you mean broadly | Explicit; close inferential gaps | Literal; criteria over prose | Prescriptive: schema + example |
| **Verbosity** | Elaborates at high effort | Longer than prior Opus, in chat and in files | Calibrates to judged task complexity | — | Scopes tightly at low/medium | Short by default |
| **Subagents** | Dispatches readily; prefers async | Delegates readily — cap it | Spawns **fewer** — ask explicitly | — | Good as the worker, not the orchestrator | Worker only |
| **Self-verification** | Wants explicit fresh-context verifier subagents on long runs | Verifies itself; **remove** verify instructions | — | — | Follows what you specify | Specify everything |
| **The trap** | Show-your-thinking instructions trigger a refusal category | "Double-check your work" causes over-verification | Review prompts saying "be conservative" suppress findings | Assuming 4.6-era prompts transfer unchanged | Under-thinking at `low` on complex work | Assuming inference it won't do |

## Fable 5 / Mythos 5

The counterintuitive tier: it wants *less* instruction than your other models.

- **Prune your prompts.** Skills written for prior models are often too
  prescriptive for Fable and can degrade output quality. Consider removing older
  instructions where default performance is better.
- **Never ask it to show its reasoning.** Instructions to echo, transcribe or
  explain internal reasoning can trigger the `reasoning_extraction` refusal
  category and cause elevated fallbacks to Opus 4.8. Audit every skill and
  system prompt for reflection language before pointing it at Fable.
- **Ground progress claims.** On long autonomous runs, instruct it to audit each
  claim against a tool result from the session. Anthropic's testing found this
  nearly eliminated fabricated status reports.
- **Give the reason, not only the request.** It performs better when it knows
  what the output enables and for whom.
- **Verifier subagents beat self-critique** on long runs — separate, fresh
  context. This is the opposite of the Opus 5 guidance below; the divergence is
  real and tier-conditional.
- **Operational:** hard tasks can run many minutes at high effort, autonomous
  runs for hours. Fix timeouts and progress indicators before migrating.

## Opus 5

- **Delete your verification scaffolding.** Explicit verification instructions —
  "include a final verification step," "use a subagent to verify" — cause
  over-verification. Removing them reduces wasted tokens with no quality loss.
  Same for "double-check your answer": it already does this well.
- **Cap delegation.** It delegates more readily than prior models. Instruct it
  to delegate only for large, genuinely independent tracks.
- **Shape the narration.** It announces what it is about to do and runs longer
  per message in agentic sessions. Describe the cadence you want rather than
  asking for less.
- **Reviews: ask for coverage, filter separately.** "Only report high-severity
  issues" will be followed literally and you will see less.
- **Low and medium effort are genuinely useful** — strong quality at a fraction
  of the tokens. Use them as the primary cost control.

## Opus 4.8

- **Thinking is off unless you ask.** This is the single biggest difference from
  Opus 5 and the one that silently degrades ported prompts.
- **Effort matters more here than on any prior Opus.** Start `xhigh` for coding
  and agentic work; minimum `high` for anything intelligence-sensitive.
- **It favours reasoning over tool calls.** Raising effort is the lever that
  increases tool use, especially in knowledge work.
- **It is literal.** It won't generalise an instruction from one item to the
  next. If you mean every section, say every section.
- **Remove forced status scaffolding** ("summarize after every 3 tool calls") —
  its own updates are better.
- **It spawns fewer subagents**, not more. If you want fan-out, ask for it.
- **Design default:** cream backgrounds, serif display, terracotta accent — good
  for editorial, wrong for dashboards and dev tools. Generic pushback ("not
  cream") just moves it to another fixed palette; specify concrete hexes and
  typefaces, or have it propose directions first.

## Opus 4.7 and 4.6 (legacy)

Still available, but migrate when you can. Two things to carry forward:

- **4.7 introduced the current tokenizer.** The same text produces roughly 30%
  more tokens than on pre-4.7 models. Any cost model built on 4.6-era counts is
  wrong.
- **4.6 used extended thinking**, now deprecated on that line. Prompts written
  around explicit thinking budgets need rewriting for adaptive thinking, not
  porting.

Treat prompts tuned on 4.6 as suspect rather than portable. Re-run an effort
sweep on your own evals after any move up this line.

## Sonnet 5

- **Effort is respected strictly, especially at the low end.** At low and
  medium it scopes to exactly what was asked. Good for cost; on moderately
  complex work at `low` there is real under-thinking risk.
- **If reasoning looks shallow, raise effort** rather than prompting around it.
  If latency forces `low`, add targeted guidance that the task is multistep.
- **Adaptive thinking is on by default** — a change from Sonnet 4.6, where the
  same request ran without thinking.
- As the executor tier, its literalism means your acceptance criteria do more
  work than your prose does.

## Haiku 4.5

The one tier where prescriptive still wins outright. Give it the output schema,
one worked example, and no room to infer. Our return contracts already assume
this — that's why they specify field names rather than describing intent.

Extended thinking is available and opt-in; adaptive thinking is not.

## The through-line

Capability inverts prompt length. The stronger the model, the more you should
say *why* and the less you should say *how*. Every generation, the instructions
that helped last year's model become the instructions that hold this year's
back — so treat prompt scaffolding as something to prune on upgrade, not
accumulate.
