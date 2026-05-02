# sigma-engineering

A Claude Code plugin packaging Sigma Digital's engineering review skills. Each skill pairs an LLM-ready review prompt (`SKILL.md`) with the human-readable playbook it derives from (`playbook.md`).

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
- **web-performance** — Core Web Vitals audit, quick wins, change-impact prediction
- **web-security** — frontend security review (XSS, CSP, auth, supply chain, framework footguns)
- **web-sre** — release readiness, post-release verification, incident diagnosis

## Source

Canonical playbooks and prompts live in [`docs/`](../../docs) at the repo root. The skill folders here are generated copies — open issues or PRs against `docs/` and the plugin will be regenerated.
