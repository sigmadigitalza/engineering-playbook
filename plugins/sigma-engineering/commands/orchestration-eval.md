---
description: Measure whether a tier configuration is actually cheaper before it becomes the Sigma standard. Run before any change to the class/effort matrix — it fixes a task set, establishes a top-tier ceiling, and compares configs on cost per task, wall-clock, human-intervention rate, and peak context.
argument-hint: "<config-name>"
---

Measure whether a tier configuration is actually cheaper before it becomes the standard. Run this before any change to the class matrix in the `sigma-feature-run` skill's `references/tiering.md`.

**Usage:** `/sigma-engineering:orchestration-eval <config-name>`

Config under test: `$ARGUMENTS`

---

## Build the task set once

Eight to twelve tasks pulled from real Sigma repositories, not benchmarks. Skew toward the work that actually consumes the week. Each task needs:

- a starting commit
- a one-paragraph brief, as a colleague would write it
- **acceptance criteria checkable without judgement** — a command and an expected exit code wherever possible
- a difficulty label: `mechanical` · `contained` · `ambiguous`

Store as `evals/orchestration/tasks/<id>.md`. The set is fixed once written — changing tasks between configs destroys comparability.

## Establish the ceiling first

Run the whole set top-tier, high effort, no delegation. This is the baseline, and it exists so that later failures can be attributed. Without it you cannot tell a model failure from a setup failure, which is the specific trap in starting cheap.

## Configurations to compare

| Config | Plan | Execute | Verify | Judgement review |
| --- | --- | --- | --- | --- |
| `ceiling` | top | top | top | top |
| `tiered` | top | mid | bottom + shell | top |
| `advisor` | top | mid + advisor | bottom + shell | top |
| `tiered-low-effort` | top, reduced effort | mid | bottom + shell | top |

## Record per run

- **cost per task** (not price per token — this is the whole point)
- wall-clock, start to acceptance
- **human-intervention rate**: how many tasks needed a person to unstick them
- **main-session peak context** — the variable the subagent design controls
- acceptance-criteria pass rate on first verification
- escalation count, and whether each escalation was warranted in hindsight

## Reading the results

- A config that ties `ceiling` on ambiguous tasks at lower cost is a win. A config that only ties on mechanical tasks has proven nothing — mechanical tasks were never the constraint.
- Human-intervention rate is the metric that quietly invalidates cost savings. Price the developer's time into the comparison or the cheap config always appears to win.
- Report variance, not just means. A config that is cheaper on average and occasionally catastrophic is not cheaper.

Three runs per config minimum. Single runs on agentic tasks are noise.
