# Feature Run

Run a feature end-to-end across tiered Claude models — planning at the top tier, implementation in the middle, deterministic verification and read-heavy recon at the bottom — without burning the main session's context or overpaying for mechanical work. The entry point to the **[`sigma-feature-run`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** skill.

**Usage:** `/sigma-engineering:feature-run [mode] <feature name or plan path>`
Modes: `plan` · `execute` · `verify` · `review` · `gather` · `report`. Omit the mode and one is inferred from repo state.

## Install and run

It ships with the [Sigma engineering plugin](https://github.com/sigmadigitalza/engineering-playbook#use-in-your-ai-assistant). Once the plugin is installed:

- The **`/sigma-engineering:feature-run`** slash command drives a run — source: [`commands/feature-run.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/commands/feature-run.md).
- The **`sigma-feature-run`** skill auto-activates whenever a task spans planning, implementation and verification — even if you never type the command.

## What it does

Routes on intent across six modes, delegates read-heavy and deterministic work to subagents, and keeps decisions — not transcripts — in the main session. The rule that matters most: capability flows down, evidence flows up; nothing below the author's tier signs off on the author's design, and a shell command beats a model call whenever one answers the question.

- **Skill:** [`sigma-feature-run/SKILL.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)
- **Standard:** [Tiered Orchestration](../standards/appendix-working-with-ai.md#4-tiered-orchestration) — the class/effort matrix and per-model prompting references.
