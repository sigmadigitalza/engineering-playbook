# AGENTS.md

Guidance for AI agents (Claude Code, GitHub Copilot, and others) working in the Sigma **engineering-playbook** repo. Humans: this is also the short version of how the repo fits together.

## What this repo is

The Sigma Engineering Standards and the review playbooks/prompts, published two ways from one source: a [Lume](https://lume.land) docs site (`docs/` + `_config.ts`) and a Claude Code plugin plus GitHub Copilot instructions under `plugins/` and `.github/instructions/`.

## Before non-trivial work

1. Read the **[Sigma Engineering Standards](docs/standards/sigma-engineering-standards.md)** — the spine every change is held to. This repo tracks edition **v1.3**; check you are reading the current one (standard §9).
2. Read the **[JavaScript / TypeScript appendix](docs/standards/appendix-javascript-typescript.md)** — this repo is Deno + TypeScript + Lume, and the dependency-minimal stance is strict here.
3. Identify the maturity tier of what you are changing and match the surrounding code's bar (standard §7–§8).

## Generated artefacts — do not hand-edit

The plugin skills and Copilot instructions are **built**, not authored:

- **Source of truth:** `docs/prompts/<name>.md` + `docs/playbooks/<name>.md` + `scripts/skills-meta.json`.
- **Generated (never edit directly):** `plugins/sigma-engineering/skills/<name>/{SKILL.md,playbook.md}` and `.github/instructions/<name>.instructions.md`.
- After changing any source, run `deno task build:skills`. CI runs `deno task build:skills:check` and fails on drift.

The one hand-maintained skill is **[`sigma-feature-run`](plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** — it has no `docs/` pair because it is an orchestration skill, not a generated review skill. Edit it in place; the generator leaves it alone.

## Running a feature in this repo

For any task large enough to span planning, implementation and verification in one session, follow the **[`sigma-feature-run`](plugins/sigma-engineering/skills/sigma-feature-run/SKILL.md)** skill — Sigma's tiered-orchestration standard. Plan at the top tier, implement in the middle, verify deterministically at the bottom, and never let a tier below the author's sign off on the author's design. The class/effort matrix lives in [`references/tiering.md`](plugins/sigma-engineering/skills/sigma-feature-run/references/tiering.md) and per-model prompting guidance in [`references/prompting.md`](plugins/sigma-engineering/skills/sigma-feature-run/references/prompting.md); the [Tiered Orchestration section of the Working With AI appendix](docs/standards/appendix-working-with-ai.md#4-tiered-orchestration) is the pointer to it from the standard. Entry points: the `/sigma-engineering:feature-run` and `/sigma-engineering:orchestration-eval` commands.

## Conventions

- **Commits & PR titles:** Conventional Commits — CI gates both ([validate-pr](.github/workflows/validate-pr.yml)).
- **Formatting:** run `deno fmt` before committing (scope in `deno.json`).
- **Build check:** `deno task build` must stay green (Lume smoke test in CI).
