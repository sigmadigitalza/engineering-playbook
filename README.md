# Engineering Playbook

Guides, prompts, and technical reference material for the engineering team at [Sigma Digital](https://github.com/sigmadigitalza).

This repo is the canonical home for how we build, review, and operate software. It pairs human-readable **playbooks** (the principles, checklists, and procedures we follow) with matching **prompts** (the LLM-ready versions of those playbooks, designed to run reviews and audits with an AI assistant).

## Install as a Claude Code plugin

The playbooks and prompts in this repo are also packaged as a Claude Code plugin. Skills auto-activate when you ask Claude to do relevant work — for example, "review this PR for security issues" will fire the `web-security` skill automatically.

```bash
/plugin marketplace add sigmadigitalza/engineering-playbook
/plugin install sigma-engineering@sigma-engineering-playbook
/reload-plugins
```

The same skills work with GitHub Copilot — copy any folder from `plugins/sigma-engineering/skills/` into your repo's `.github/skills/` directory, or into `~/.copilot/skills/` for personal scope. The `SKILL.md` format is a cross-vendor open standard.

## Contents

### Playbooks — [`docs/playbooks`](docs/playbooks)

Long-form guides describing how we approach a discipline, what "good" looks like, and the specific checks and procedures we run.

| Playbook | What it covers |
|----------|----------------|
| [API design review](docs/playbooks/api-design-review.md) | REST and GraphQL contract design, error shape, idempotency, versioning, and backwards-compatibility risk. |
| [Code review](docs/playbooks/code-review.md) | Sigma's posture, severity-ordered rubric, and Conventional Comments convention for PR review and pre-PR self-review. |
| [Database review](docs/playbooks/database-review.md) | Schema design, online-safe migrations, and query/index performance review for relational databases. |
| [Documentation review](docs/playbooks/documentation-review.md) | Standards and checks for technical documentation quality, structure, and accuracy. |
| [Frontend accessibility review](docs/playbooks/frontend-accessibility-review.md) | WCAG 2.2 AA review of web frontends — semantic HTML, ARIA, keyboard, screen reader, contrast, forms, motion, i18n. |
| [GitHub Actions review](docs/playbooks/github-actions-review.md) | Workflow design, security, and reliability practices for CI/CD pipelines. |
| [Incident postmortem](docs/playbooks/incident-postmortem.md) | Blameless postmortem template, drafting and review rubric for post-incident reviews. |
| [Web performance](docs/playbooks/web-performance.md) | Core Web Vitals audit, lab-vs-field discipline, and quick-win optimisations for web applications. |
| [Web security](docs/playbooks/web-security.md) | Threat model, hardening checklist, and review procedure for web applications. |
| [Web SRE](docs/playbooks/web-sre.md) | Reliability, observability, and incident-response practices for web services. |

### Prompts — [`docs/prompts`](docs/prompts)

Each playbook has a paired prompt designed to be handed to an LLM (Claude, ChatGPT, etc.) to run the review autonomously against a codebase, PR, or artefact.

| Prompt | Pairs with |
|--------|------------|
| [API design review](docs/prompts/api-design-review.md) | [API design review playbook](docs/playbooks/api-design-review.md) |
| [Code review](docs/prompts/code-review.md) | [Code review playbook](docs/playbooks/code-review.md) |
| [Database review](docs/prompts/database-review.md) | [Database review playbook](docs/playbooks/database-review.md) |
| [Documentation review](docs/prompts/documentation-review.md) | [Documentation review playbook](docs/playbooks/documentation-review.md) |
| [Frontend accessibility review](docs/prompts/frontend-accessibility-review.md) | [Frontend accessibility review playbook](docs/playbooks/frontend-accessibility-review.md) |
| [GitHub Actions review](docs/prompts/github-actions-review.md) | [GitHub Actions review playbook](docs/playbooks/github-actions-review.md) |
| [Incident postmortem](docs/prompts/incident-postmortem.md) | [Incident postmortem playbook](docs/playbooks/incident-postmortem.md) |
| [Web performance](docs/prompts/web-performance.md) | [Web performance playbook](docs/playbooks/web-performance.md) |
| [Web security](docs/prompts/web-security.md) | [Web security playbook](docs/playbooks/web-security.md) |
| [Web SRE](docs/prompts/web-sre.md) | [Web SRE playbook](docs/playbooks/web-sre.md) |

## How to use this repo

- **Onboarding** — read the relevant playbook for the discipline you're working in.
- **Reviews** — pull the matching prompt into your AI assistant of choice and point it at the artefact you want reviewed (a PR, a workflow file, a service, etc.).
- **Improving the playbooks** — these are living documents. Open a PR with corrections, additions, or new playbooks for disciplines we haven't covered yet.

## Contributing

1. Branch from `main`.
2. Keep playbooks and prompts in sync — if you add a check to a playbook, update the corresponding prompt (and vice versa).
3. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …) for commit messages.
4. Open a PR and request review from the engineering team.

## Roadmap

The initial set of disciplines is shipped. Open an issue or PR to suggest a new playbook (e.g., observability and alerting, on-call handoff, data pipeline review, mobile release).
