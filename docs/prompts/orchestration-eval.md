# Orchestration Eval

The measurement harness for the **[`sigma-feature-run`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** skill — prove a tier configuration is actually cheaper *before* it becomes the standard. Run it before any change to the class matrix.

**Usage:** `/orchestration-eval <config-name>`

It fixes a task set drawn from real Sigma repositories, establishes a top-tier ceiling so later failures can be attributed to the config rather than the setup, then compares configurations on cost per task, wall-clock, human-intervention rate, main-session peak context and first-pass acceptance — reporting variance, not just means.

This page is a pointer. The canonical prompt lives with the skill, so there is one copy to maintain, not two:

- **Prompt:** [`prompts/orchestration-eval.prompt.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/prompts/orchestration-eval.prompt.md)
- **Skill:** [`sigma-feature-run/SKILL.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)
- **Standard:** [Tiered Orchestration — Working With AI appendix](../standards/appendix-working-with-ai.md#4-tiered-orchestration) — the class/effort matrix this harness is built to defend.
