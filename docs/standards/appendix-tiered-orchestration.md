# Appendix — Tiered Orchestration

*Practice appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). How we run a feature end-to-end across tiered Claude models — planning at the top tier, implementation in the middle, deterministic verification and read-heavy recon at the bottom — without burning the main session's context or overpaying for mechanical work. This is the standard an AI agent follows when a task spans planning, implementation and verification in one session (see [§8, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

This appendix is a pointer, not a manual. The other appendices are prose a developer reads and applies by hand; the orchestration standard is mostly instructions an *agent* runs, so it ships as an executable **skill** and this page links to it. Keeping one canonical copy is the point — the class/effort matrix and the per-model prompting guidance live in exactly one place each, and both a subset restated here and a subset restated in a prompt would drift.

## The skill

**[`sigma-feature-run`](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** — the house standard for a feature run. It routes on intent across six modes — `plan`, `execute`, `verify`, `review`, `gather`, `report` — delegates read-heavy and deterministic work to subagents, and keeps decisions, not transcripts, in the main session. It installs with the Sigma engineering plugin; the entry points are the [`/feature-run` and `/orchestration-eval`](../prompts/) prompts.

Its operating principles in one breath: capability flows down and evidence flows up; nothing below the author's tier signs off on the author's design; a shell command beats a model call whenever one answers the question; and every mode is idempotent, so a half-finished run resumes without redoing work.

## Canonical references

One set per topic. Link to these — do not restate them here or in a prompt.

- **[Tiering — class, effort, and when to delegate](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/references/tiering.md)** — the class/effort matrix, the escalation triggers, the advisor inversion, and the "is this subagent worth its context window" test. The single source for *which* model does which work.
- **[Prompting by model](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/references/prompting.md)** — per-model prompting guidance and the cross-model comparison chart, including the legacy Opus builds. The single source for *how* to write for a given tier. Read it before authoring any prompt bound to a specific model: verification scaffolding, show-your-reasoning language and delegation caps all invert across the range.
- **[Return contracts](https://github.com/sigmadigitalza/engineering-playbook/blob/main/plugins/sigma-engineering/skills/sigma-feature-run/references/return-contracts.md)** — the required return schema for every delegated task, written so a subagent's omissions are visible rather than silent.

## When it applies

A feature run is a Tier 1+ activity (see [§7, Maturity Tiers](./sigma-engineering-standards.md#7-maturity-tiers)): the plan's acceptance criteria are the artefact the rest of the run is measured against, and the judgement review at the end is held to the author's tier or above. Reach for the skill whenever a task is large enough to span planning, implementation and verification in one session — even when the word "orchestration" is never said.

---

*Sigma Tiered Orchestration Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
