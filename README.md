# Engineering Playbook

Guides, prompts, and technical reference material for the engineering team at [Sigma Digital](https://github.com/sigmadigitalza).

This repo is the canonical home for how we build, review, and operate software. It pairs human-readable **playbooks** (the principles, checklists, and procedures we follow) with matching **prompts** (the LLM-ready versions of those playbooks, designed to run reviews and audits with an AI assistant).

## Contents

### Playbooks — [`docs/playbooks`](docs/playbooks)

Long-form guides describing how we approach a discipline, what "good" looks like, and the specific checks and procedures we run.

| Playbook | What it covers |
|----------|----------------|
| [Documentation review](docs/playbooks/documentation-review.md) | Standards and checks for technical documentation quality, structure, and accuracy. |
| [GitHub Actions review](docs/playbooks/github-actions-review.md) | Workflow design, security, and reliability practices for CI/CD pipelines. |
| [Web security](docs/playbooks/web-security.md) | Threat model, hardening checklist, and review procedure for web applications. |
| [Web SRE](docs/playbooks/web-sre.md) | Reliability, observability, and incident-response practices for web services. |

### Prompts — [`docs/prompts`](docs/prompts)

Each playbook has a paired prompt designed to be handed to an LLM (Claude, ChatGPT, etc.) to run the review autonomously against a codebase, PR, or artefact.

| Prompt | Pairs with |
|--------|------------|
| [Documentation review](docs/prompts/documentation-review.md) | [Documentation review playbook](docs/playbooks/documentation-review.md) |
| [GitHub Actions review](docs/prompts/github-actions-review.md) | [GitHub Actions review playbook](docs/playbooks/github-actions-review.md) |
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

Disciplines we plan to cover next:

- API design review
- Database schema and migration review
- Frontend accessibility review
- Code review (general)
- Incident postmortem template
