# sigma-engineering

A Claude Code plugin packaging Sigma Digital's engineering skills — a set of review skills plus the `sigma-feature-run` orchestration skill. Each review skill pairs an LLM-ready prompt (`SKILL.md`) with the human-readable playbook it derives from (`playbook.md`).

## How it works

Skills auto-activate based on what the user is doing. Claude Code (and Claude Desktop) reads each skill's `description` field and matches it against the current request — so asking "review this PR for security issues" fires `web-security` automatically without anyone naming it. Each skill points Claude at the paired `playbook.md` for the full checklist and rationale when it needs to go deeper.

## GitHub Copilot

The same review prompts are also published in GitHub Copilot's custom-instructions format at [`.github/instructions/`](../../.github/instructions) at the repo root. Copilot uses a different filename convention (`<name>.instructions.md`) and a different frontmatter schema (`description` + `applyTo` glob), but the prompt body is the same. Both trees are regenerated from `docs/prompts/` by `deno task build:skills` and stay in sync.

If you're using Copilot, copy from `.github/instructions/`, not from this directory. See the [repo README](../../README.md#use-in-your-ai-assistant) for instructions.

## Available skills

- **api-design-review** — REST and GraphQL contract design, versioning, backwards-compatibility risk
- **code-review** — defect-finding, severity-ordered review using Conventional Comments
- **database-review** — schema design, online-safe migrations, query/index performance (Postgres-biased)
- **documentation-review** — clarity, accuracy, structure, and agent-readability for docs
- **frontend-accessibility-review** — WCAG 2.2 Level AA audit of web frontends
- **github-actions-review** — workflow security, reliability, supply-chain risk, cost
- **incident-postmortem** — drafting and reviewing blameless post-incident reviews
- **repo-setup-review** — GitHub repo configuration audit (branch/tag rulesets, CODEOWNERS, collaborators, token scope, secret scanning); companion to `github-actions-review`
- **web-performance** — Core Web Vitals audit, quick wins, change-impact prediction
- **web-security** — frontend security review (XSS, CSP, auth, supply chain, framework footguns)
- **web-sre** — release readiness, post-release verification, incident diagnosis
- **writing-style** — the house prose style (literal, active, one idea per sentence) applied to everything the agent writes, plus a review mode
- **sigma-feature-run** — *(orchestration, not review)* running a feature end-to-end across tiered Claude models with delegated verification, recon, and review-gathering

## Output style

`output-styles/sigma-terse.md` is the same writing-style prompt packaged as a Claude Code output style, so it applies to every reply in the main session. Select it in `/config` → Output style, or pin it per repo with `"outputStyle": "sigma-terse"` in `.claude/settings.json`. It is generated from `docs/prompts/writing-style.md` like the skill; do not edit it here.

## Commands

Two slash commands install with the plugin, namespaced under `sigma-engineering`:

- **`/sigma-engineering:feature-run [mode] <feature>`** — run a feature end-to-end under the tiered-orchestration standard (`plan` · `execute` · `verify` · `review` · `gather` · `report`); drives the `sigma-feature-run` skill.
- **`/sigma-engineering:orchestration-eval <config>`** — measure whether a tier configuration is actually cheaper before it becomes the standard.

## Source

Canonical playbooks and prompts live in [`docs/`](../../docs) at the repo root. The review skill folders and `output-styles/` here are generated copies — open issues or PRs against `docs/` and the plugin will be regenerated. The exceptions are the `sigma-feature-run` skill and the two `commands/`, hand-maintained in place (no `docs/` pair) — edit them under `skills/sigma-feature-run/` and `commands/` directly.
