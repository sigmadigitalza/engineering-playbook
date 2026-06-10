# Appendix — CI/CD

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers continuous integration and delivery — the pipeline, releases, deployment, and the observability around them — sized for a small team that runs its own DevOps by design. This is developer best practice first — how a Sigma engineer ships through automation. It is also the bar for any AI agent touching our pipelines: match these patterns, and surface any deviation (see [§8 of the standard, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

## 1. The Pipeline

- **Every PR runs the pipeline.** Build, format check, lint, type-check, tests, and a vulnerability/secret scan — all on every pull request, all required to merge. Red doesn't ship.
- **Fast, or it gets bypassed.** Keep the PR pipeline under ~10 minutes: cache dependencies, run independent jobs in parallel, move slow end-to-end suites to a separate trigger.
- **The pipeline is the gate.** `main` is protected, the checks are required, nobody merges around red. (See the [GitHub Actions review playbook](../playbooks/github-actions-review.md) for hardening the workflows themselves.)
- **Least-privilege CI.** Third-party actions pinned to a SHA, `GITHUB_TOKEN` scoped to the minimum, secrets from the platform store and OIDC over long-lived keys.

## 2. Releases & Versioning

- **Releases are automated from commits.** Conventional Commits drive the version bump and the changelog — `feat` → minor, `fix` → patch, breaking → major. (See the [Version Control appendix](./appendix-version-control.md).)
- **Release notes write themselves.** The merged commits since the last tag become the grouped notes; a human edits the prose, not the list. `release-please` or `semantic-release` own the mechanics.
- **Tag-driven and reproducible.** A release is an annotated, signed `vX.Y.Z` tag; the build for that tag is reproducible and its artefacts checksummed.
- **Build once, deploy many.** The same artefact promotes through environments — no rebuilding per environment.

## 3. Deployment — Push vs Pull

- **Push (CI deploys) is the small-team default.** The pipeline that built the release deploys it. Few moving parts, easy to reason about — right up until your environment count or compliance needs outgrow it.
- **Pull (GitOps) when the estate justifies it.** A reconciler watches a Git repo of desired state and converges the target. More setup, but state is auditable and self-healing. Don't reach for it before you need it.
- **Progressive delivery.** Roll out behind a flag or to a canary, watch the signals, then widen. Every deploy has a tested, one-command rollback.
- **Boring and frequent beats big-bang.** Small changes shipped often mean lower risk per deploy and faster recovery — DORA's four metrics are the scoreboard.

## 4. Observability

- **Three pillars, wired from day one:** structured **logs** (correlation IDs, no PII), **metrics** (RED / USE — rates, errors, durations · utilisation, saturation), and **traces** across service boundaries. **OpenTelemetry** is the vendor-neutral default.
- **SLOs, not vibes.** Define "healthy" as a measurable objective with an error budget; alert on the budget burning, not on every blip.
- **Alert on symptoms; page only on the painful ones.** An alert a human can't act on is noise to delete, and every page links a runbook.
- **You build it, you run it.** The team that ships owns the dashboards, the alerts, and the on-call. (See the [Web SRE playbook](../playbooks/web-sre.md).)

## 5. Small-Team DevOps

- **Automate the toil, not the judgement.** Done it by hand three times? Script it — CI is where scripts live. Reserve human attention for decisions.
- **Boring, managed infrastructure.** Prefer managed services and a small, well-understood stack over a bespoke platform you also have to operate. Innovation tokens are finite.
- **Infrastructure as code.** Environments are declared, versioned, and reviewed like application code — no click-ops you can't reproduce.
- **Security runs in the pipeline.** Dependency and container scanning, SBOMs, and the [main standard §6](./sigma-engineering-standards.md#6-supply-chain-integrity) supply-chain checks happen in CI, not as an afterthought.

## 6. The Checklist (PR-time)

- [ ] Pipeline green: build, lint, type-check, tests, scans
- [ ] PR pipeline stays fast; slow suites on a separate trigger
- [ ] Actions SHA-pinned; token least-privileged; no secrets in logs
- [ ] User-facing change reflected in the (generated) changelog / release notes
- [ ] New code paths emit logs/metrics/traces; alerts have runbooks
- [ ] Deploy has a tested rollback

---

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions).
- [OpenTelemetry](https://opentelemetry.io/docs/).
- [Google SRE Books](https://sre.google/books/).
- [DORA — DevOps Research and Assessment](https://dora.dev/).
- [The Twelve-Factor App](https://12factor.net/).

---

*Sigma CI/CD Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
