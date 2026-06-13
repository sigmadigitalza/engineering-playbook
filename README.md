# Engineering Playbook

Guides, prompts, and technical reference material for the engineering team at [Sigma Digital](https://github.com/sigmadigitalza).

This repo is the canonical home for how we build, review, and operate software. It pairs human-readable **playbooks** (the principles, checklists, and procedures we follow) with matching **prompts** (the LLM-ready versions of those playbooks, designed to run reviews and audits with an AI assistant).

## Use in your AI assistant

The playbooks ship in two formats so the same review prompts auto-activate regardless of which assistant you're using. Both are generated from the canonical `docs/` tree by [`scripts/build-skills.ts`](scripts/build-skills.ts) — `deno task build:skills` regenerates everything in place.

In every install path below, skills auto-activate by description match — say "review this PR for security issues" and the `web-security` skill fires automatically.

### Claude Code (the CLI)

Install as a plugin via our marketplace:

```text
/plugin marketplace add sigmadigitalza/engineering-playbook
/plugin install sigma-engineering@sigma-engineering-playbook
/reload-plugins          # activate now — optional; restarting Claude Code also works
```

The plugin source is checked in at [`plugins/sigma-engineering/`](plugins/sigma-engineering) — no build step required to install.

**Updating.** Git-marketplace plugins don't auto-update by default, so pull the latest skills explicitly:

```text
/plugin marketplace update sigma-engineering-playbook
/plugin install sigma-engineering@sigma-engineering-playbook
```

`claude plugin list` shows your installed version. To stay current automatically, open `/plugin` → **Marketplaces** and enable auto-update for `sigma-engineering-playbook`. A marketplace update only pulls a new build when the plugin `version` changes — which we bump whenever the skills change.

### Claude Desktop and Claude.ai

Claude Desktop and Claude.ai don't have the `/plugin` command, but they read skills from `~/.claude/skills/` directly. Install with one shell command:

```bash
mkdir -p ~/.claude/skills && \
  git clone --depth 1 https://github.com/sigmadigitalza/engineering-playbook /tmp/sigma-eng-pb && \
  cp -R /tmp/sigma-eng-pb/plugins/sigma-engineering/skills/. ~/.claude/skills/ && \
  rm -rf /tmp/sigma-eng-pb
```

Restart Claude Desktop after the copy. To upgrade later, re-run the same command — `cp -R` overwrites in place.

### GitHub Copilot

Each skill is also published as a Copilot custom-instructions file at [`.github/instructions/<name>.instructions.md`](.github/instructions). They're read by Copilot Chat (in your editor), Copilot code review, and the **Copilot coding agent** — the cloud agent that works issues and PRs from inside GitHub Actions. Triggering is automatic, from each file's `description` and `applyTo` glob; the coding agent reads whatever is in the repo's `.github/instructions/`, so there's nothing to wire up beyond adding the files.

To use them in your own repo, copy the relevant files into your repo's `.github/instructions/` directory:

```bash
# Pull a single skill
curl -sLo .github/instructions/web-security.instructions.md \
  https://raw.githubusercontent.com/sigmadigitalza/engineering-playbook/main/.github/instructions/web-security.instructions.md

# Or sync the whole set
gh repo clone sigmadigitalza/engineering-playbook /tmp/eng-pb
cp -r /tmp/eng-pb/.github/instructions/. .github/instructions/
```

**Keep them current automatically.** For a repo where the coding agent runs cloud reviews, a scheduled workflow that opens a PR when our instructions change keeps the agent on the latest guidance:

```yaml
# .github/workflows/sync-sigma-instructions.yml
name: Sync Sigma engineering instructions
on:
  schedule: [{ cron: "0 6 * * 1" }]   # Mondays, 06:00 UTC
  workflow_dispatch:
permissions:
  contents: write
  pull-requests: write
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Pull the latest instructions
        run: |
          tmp="$(mktemp -d)"
          git clone --depth 1 https://github.com/sigmadigitalza/engineering-playbook "$tmp"
          mkdir -p .github/instructions
          cp "$tmp"/.github/instructions/*.instructions.md .github/instructions/
          rm -rf "$tmp"
      - name: Open a PR if anything changed
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git switch -c chore/sync-sigma-instructions
          git add .github/instructions/*.instructions.md
          git diff --cached --quiet && { echo "Already up to date."; exit 0; }
          git commit -m "chore: sync Sigma engineering Copilot instructions"
          git push -fu origin chore/sync-sigma-instructions
          gh pr create --fill --base "${GITHUB_REF_NAME}" || true
```

There is no "marketplace" for Copilot instructions — distribution is per-repo. For org-wide rollout, run the workflow above from a template repo, or vendor the directory into your repo template.

> The `SKILL.md` format used by Claude and the `*.instructions.md` format used by Copilot are different file conventions, but the prompt body is identical between them. The generator keeps them in sync.

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
| [Repo setup & review](docs/playbooks/repo-setup-review.md) | GitHub repo configuration audit — branch and tag rulesets, CODEOWNERS, collaborators, default token scope, secret scanning, contribution gates. Posture-aware. |
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
| [Repo setup & review](docs/prompts/repo-setup-review.md) | [Repo setup & review playbook](docs/playbooks/repo-setup-review.md) |
| [Web performance](docs/prompts/web-performance.md) | [Web performance playbook](docs/playbooks/web-performance.md) |
| [Web security](docs/prompts/web-security.md) | [Web security playbook](docs/playbooks/web-security.md) |
| [Web SRE](docs/prompts/web-sre.md) | [Web SRE playbook](docs/playbooks/web-sre.md) |

### Engineering standards — [`docs/standards`](docs/standards)

Our shared engineering foundation — the principles and defaults we build from. Stack appendices translate them into per-language idioms.

| Document | What it covers |
|----------|----------------|
| [Sigma Engineering Standards](docs/standards/sigma-engineering-standards.md) | The Sigma Ten, security / resilience / supply-chain baselines, maturity tiers, and per-language engineering guidelines. |
| [JavaScript / TypeScript appendix](docs/standards/appendix-javascript-typescript.md) | Deno-first, dependency-minimal idioms for services and frontend. |
| [Go appendix](docs/standards/appendix-golang.md) | Services, CLIs, and tooling. |
| [Android / Kotlin appendix](docs/standards/appendix-android-kotlin.md) | Mobile and JVM Kotlin. |
| [Godot appendix](docs/standards/appendix-godot.md) | GDScript game and interactive content. |
| [Version Control appendix](docs/standards/appendix-version-control.md) | Git, Conventional Commits, PR workflow, changelog, repo hygiene, tooling. |
| [CI/CD appendix](docs/standards/appendix-ci-cd.md) | Pipeline, automated releases and notes, push-vs-pull deploys, observability, small-team DevOps. |
| [Accessibility appendix](docs/standards/appendix-accessibility.md) | Accessible by default — WCAG 2.2 AA and inclusive practice. |
| [Working With AI appendix](docs/standards/appendix-working-with-ai.md) | Using AI agents responsibly, plus a kickoff prompt that maps the handbook. |
| [Good Ideas appendix](docs/standards/appendix-good-ideas.md) | Annotated reading list — the influences behind the standard. |

## How to use this repo

- **Onboarding** — read the relevant playbook for the discipline you're working in.
- **Reviews** — pull the matching prompt into your AI assistant of choice and point it at the artefact you want reviewed (a PR, a workflow file, a service, etc.).
- **Improving the playbooks** — these are living documents. Open a PR with corrections, additions, or new playbooks for disciplines we haven't covered yet.

## Contributing

1. Branch from `main`.
2. Keep playbooks and prompts in sync — if you add a check to a playbook, update the corresponding prompt (and vice versa).
3. If you change a skill's body (`docs/prompts/`, `docs/playbooks/`) or metadata (`scripts/skills-meta.json`), run `deno task build:skills` to regenerate the plugin and Copilot instructions, and bump `version` in [`plugins/sigma-engineering/.claude-plugin/plugin.json`](plugins/sigma-engineering/.claude-plugin/plugin.json) so installed plugins pick up the change.
4. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …) for commit messages.
5. Open a PR and request review from the engineering team.

## Roadmap

The initial set of disciplines is shipped. Open an issue or PR to suggest a new playbook (e.g., observability and alerting, on-call handoff, data pipeline review, mobile release).
