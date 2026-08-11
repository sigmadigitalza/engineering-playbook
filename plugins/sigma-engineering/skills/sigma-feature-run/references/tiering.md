# Tiering: class, effort, and when to delegate

## Contents

- Class matrix
- Effort before class
- Escalation triggers
- The advisor inversion
- Is this subagent worth its context window?

## Class matrix

| Work | Class | Why |
| --- | --- | --- |
| Feature planning, decomposition, seam selection | Fable / Opus, high effort | Plan quality sets the ceiling for everything downstream |
| Judgement review, architectural critique | Author's class or above | Catching a wrong abstraction costs as much capability as choosing one |
| Implementation against a good plan | Sonnet, escalating | Mechanical once the plan is right |
| Spec-compliance review | Sonnet | Comparison against stated criteria, not judgement |
| Recon: call paths, callers, module tours | Sonnet or Haiku | Read-heavy, low judgement, high token volume |
| CI log triage, failure clustering | Haiku | Compression with light judgement |
| "Did the suite pass", "which tests failed" | **No model** — shell | Deterministic, free, cannot hallucinate |

The last row is the one teams skip. An exit code and a `grep` answer those
questions perfectly. Spending a model call on them buys nothing and introduces a
failure mode that didn't exist.

## Effort before class

Class and effort are independent dials. On current Opus and Sonnet models the
effort parameter defaults to high on the API and in Claude Code, so a top-class
model at reduced effort is often cheaper *and* better than a mid-class model at
full effort. Before demoting a step's class, try demoting its effort and
re-measure.

Corollary: cost per **task** is the metric, not price per token. A stronger model
that takes four turns beats a cheaper one that takes fourteen.

## Escalation triggers

The executor escalates to the planning tier when:

- Two consecutive attempts at a task fail verification for different reasons.
- The change requires a decision the plan didn't anticipate.
- The right fix would touch a file outside the plan's stated scope.
- A test needs changing to pass. (Escalate every time. No exceptions.)

The executor does **not** escalate for: unfamiliar syntax, a missing import, a
flaky test that passes on rerun, or anything a doc lookup resolves.

## The advisor inversion

The default mental model — a large model decomposes and delegates to small
workers — has a cheaper inversion. In the advisor pattern the smaller model
drives the loop and consults a frontier model only when it hits a reasoning
wall; the advisor never calls tools or produces user-facing output. Frontier
reasoning applies only at the moments that need it, and the rest of the run
stays at executor cost. Anthropic's published evaluation put Sonnet with an Opus
advisor ahead of Sonnet alone on SWE-bench Multilingual while reducing cost per
agentic task.

Benchmark it against top-tier execution before committing either way. Which wins
depends on how often your work actually hits a wall.

## Is this subagent worth its context window?

A subagent costs a full context window plus round-trip overhead. It pays when
the ratio is good:

> **Delegate when the work reads ≫ what it returns.** 40k tokens of log in, 600
> tokens of findings out, is a clear win. 2k in, 1.5k out is a loss.

Practical band: three to five concurrent subagents. Beyond that, coordination
overhead and merge conflicts eat the gains.

**The orchestrator integrates.** Never ask subagents to integrate each other's
work — you get duplication and conflicting edits. They report; you merge.
