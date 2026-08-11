# Feature Run

The entry-point prompt for the **[`sigma-feature-run`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** skill — run a feature end-to-end across tiered Claude models with delegated verification, recon and review-gathering, without burning the main session's context or overpaying for mechanical work.

**Usage:** `/feature-run [mode] <feature name or plan path>`
Modes: `plan` · `execute` · `verify` · `review` · `gather` · `report`. Omit the mode and one is inferred from repo state.

This page is a pointer so the prompt is discoverable alongside the review prompts. The canonical prompt — the one the skill loads and runs — lives with the skill, so there is one copy to maintain, not two:

- **Prompt:** [`prompts/feature-run.prompt.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/prompts/feature-run.prompt.md)
- **Skill:** [`sigma-feature-run/SKILL.md`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)
- **Standard:** [Tiered Orchestration — Working With AI appendix](../standards/appendix-working-with-ai.md#4-tiered-orchestration) — the class/effort matrix and per-model prompting references.

Install the [Sigma engineering plugin](https://github.com/sigmadigitalza/engineering-playbook#use-in-your-ai-assistant) and the skill auto-loads whenever a task spans planning, implementation and verification; this prompt is how you drive it.
