# Orchestration Eval

Prove a tier configuration is actually cheaper *before* it becomes the standard — run it before any change to the class matrix. The measurement harness for the **[`sigma-feature-run`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** skill.

**Usage:** `/sigma-engineering:orchestration-eval <config-name>`

## Install and run

It ships with the [Sigma engineering plugin](https://github.com/sigmadigitalza/engineering-playbook#use-in-your-ai-assistant). Once installed, the **`/sigma-engineering:orchestration-eval`** slash command runs it — source: [`commands/orchestration-eval.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/commands/orchestration-eval.md).

## What it does

Fixes a task set drawn from real Sigma repositories, establishes a top-tier ceiling so later failures can be attributed to the config rather than the setup, then compares configurations on cost per task, wall-clock, human-intervention rate, main-session peak context and first-pass acceptance — reporting variance, not just means. Three runs per config minimum.

- **Skill:** [`sigma-feature-run/SKILL.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)
- **Standard:** [Tiered Orchestration](../standards/appendix-working-with-ai.md#4-tiered-orchestration) — the class/effort matrix this harness is built to defend.
