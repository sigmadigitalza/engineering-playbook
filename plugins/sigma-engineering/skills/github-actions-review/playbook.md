# GitHub Actions Review & Optimization Playbook

A strategy and Claude Code prompt for auditing GitHub Actions workflows for cost, performance, correctness, and security — with awareness of Blacksmith runner adoption.

---

## Strategy

**Four phases, in order.** Claude Code does better work when forced into reconnaissance before analysis. Otherwise it tends to start "fixing" the first workflow it opens based on pattern-match, miss cross-workflow duplication, and skip the scripts the workflows call. So: (1) inventory the workflow surface including composite actions and referenced scripts, (2) analyze against a rubric, (3) report in a strict A/B/C structure, (4) only then offer to implement.

**Detect the Blacksmith posture first.** The recommendations change meaningfully. If Blacksmith is in use, the prompt should steer toward `useblacksmith/cache` and `useblacksmith/setup-*`, recommend right-sized Blacksmith SKUs, and be aware that sticky caches reduce the value of some `actions/cache` tuning. If Blacksmith is *not* in use, it should flag where migration would have the highest ROI rather than just recommending it blanket.

**The safe/unsafe split is the core of requirement #4.** Split findings into three buckets rather than two:

- **A — Functionality-preserving optimizations** (cache keys, pinning to SHA, adding `timeout-minutes`, `fetch-depth: 1`, path filters that provably don't change behavior). Only these get auto-applied.
- **B — Judgment-call improvements** (adding concurrency cancellation, restructuring matrices, introducing reusable workflows, moving to Blacksmith, adding new scans). These change behavior or add surface area. Follow-up prompt only.
- **C — Bugs & security findings.** Many security fixes *do* change behavior (e.g., tightening `permissions:`, swapping `pull_request_target` patterns). Auto-applying them is risky because it can break PR check runs in ways that surface only when a specific trigger fires. Follow-up prompt only.

**A concurrency nuance worth encoding.** The Blacksmith "protect prod" article's point is that `cancel-in-progress: true` belongs on PR workflows, *not* deploy workflows — killing a deploy mid-apply can leave infra in a broken state. The prompt should call this out explicitly so Claude Code doesn't blanket-apply cancellation to a `main`-branch deploy workflow.

**Make it read scripts too.** A lot of "workflow" logic lives in `.github/scripts/*.sh`, Makefile targets, or composite actions under `.github/actions/`. Without an explicit instruction, Claude Code will often judge a workflow solely by the YAML and miss `set -e` bugs or shell injection in the called scripts.

**Adversarial security posture.** For requirement #3, "expert level critical" means telling Claude Code to assume a reviewer-hostile posture on security findings and require it to cite specific lines. This produces markedly better security review than "please check for security issues."

**Anchor to GitHub's own security guidance.** The [GitHub Actions Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use) is the authoritative baseline — it's the single doc that codifies what "good" looks like for secrets, action pinning, OIDC, environment protection, self-hosted runners, and dependency review. The rubric below is grouped by the same themes that doc uses, so a finding can cite both "this is in our rubric" and "this is what GitHub publishes as the rule." When the doc updates (it's a living reference), the prompt and skill should follow. The rubric is also cross-referenced with the OWASP Top 10 CI/CD Security Risks taxonomy and the OpenSSF Scorecard checks for vendor-neutral framing, and recommends concrete tooling (`zizmor`, `actionlint`, `harden-runner`, `dependency-review-action`) so reviewers can suggest CI additions, not just findings.

---

## The Prompt

Paste the block below into Claude Code, run from the repo root.

````markdown
You are a senior DevOps / Platform Engineering expert specializing in GitHub Actions, CI/CD cost optimization, and supply-chain security. Assume an adversarial, critical review posture. Cite specific files and line numbers for every finding. Do not summarize or hedge where you can be specific.

# SCOPE

Review every workflow file under `.github/workflows/` plus all related automation:
- Composite actions under `.github/actions/`
- Reusable workflows referenced via `uses:` (local paths and remote repos)
- Scripts invoked by workflows: shell scripts, Makefile targets, Python/Node helpers
- `.github/dependabot.yml` and `CODEOWNERS` if present

If a workflow calls a script, read the script before judging the workflow. If a workflow uses a third-party action you are not certain about, fetch its `action.yml` or README before making recommendations that depend on its behavior.

# PHASE 1 — RECONNAISSANCE

Do this first. Report a brief summary before doing any analysis.

1. List every workflow with its triggers, runner(s), top-level purpose, and whether it has a `permissions:` block and `concurrency:` block.
2. Detect runner strategy per workflow: GitHub-hosted (`ubuntu-latest` etc.), Blacksmith (`blacksmith-*`), or self-hosted. Flag mixed usage within a single workflow.
3. Detect the project stack (Node/TS, Go, Kotlin/Android, Godot, Python, etc.) — this determines appropriate caching, setup actions, and matrix recommendations.
4. Detect Blacksmith adoption globally. If yes, check usage of `useblacksmith/cache`, `useblacksmith/setup-node`, `useblacksmith/setup-go`, etc. If no, recommendations should target `actions/*` equivalents and note where Blacksmith migration is highest-value.

# PHASE 2 — ANALYSIS RUBRIC

For each finding, record: file path, line range, severity (Critical/High/Medium/Low/Nit), and one of:
- **SAFE** — functionality-preserving (no change to job outputs, artifacts, or observable behavior)
- **JUDGMENT** — changes behavior or adds surface area
- **SECURITY** — security/bug finding

## Cost & Performance

- **Runner right-sizing.** Is the job CPU- or memory-bound? Is a 2-vCPU runner enough? If Blacksmith: recommend a specific SKU (`blacksmith-2vcpu-ubuntu-2404` vs `blacksmith-8vcpu-...`). If GitHub-hosted: flag where Blacksmith migration would cut cost/time and estimate the delta.
- **Dependency caching.** Present? Correct cache key? Sensible `restore-keys` fallback? Expected hit rate? Prefer `useblacksmith/cache` when Blacksmith is in use (sticky caches, no network hop).
- **`actions/checkout` depth.** Is `fetch-depth: 0` used when only HEAD is needed? Flag. Note cases where full history *is* required (release tooling, `git log`-based logic).
- **Concurrency groups.** Missing `concurrency: { group: ..., cancel-in-progress: true }` on PR workflows is a direct cost leak. BUT: do not recommend `cancel-in-progress: true` on deploy workflows targeting `main`/prod — interrupted deploys can leave infra in a broken state. Recommend `cancel-in-progress: false` with a unique group there.
- **Path filters.** Workflows triggered on changes that don't affect them (e.g., docs-only change triggering a full integration test suite).
- **Matrix strategy.** Redundant combinations, `fail-fast: false` missing where warranted, or present where it causes wasted runs.
- **Parallelization.** Sequential jobs that could run in parallel via `needs:` restructuring.
- **`timeout-minutes`.** Missing on any job is a runaway-cost risk. Recommend a sensible default per job type.
- **Artifact management.** Oversized uploads, missing compression, excessive retention.
- **Service containers vs installed services.** Over-provisioning (e.g., running a full Postgres container for a unit test suite that mocks the DB).

## Correctness & Robustness

- **Triggers.** `on:` correctness — duplicate `push` + `pull_request` causing double runs, missing `pull_request.types` filters, wrong branch filters.
- **`if:` conditions.** String-comparison bugs, missing quoting around contexts, incorrect use of `success()`/`failure()`/`always()`.
- **Job dependencies.** Missing `needs:` causing race conditions; over-constrained graphs serializing needlessly.
- **Env vs secrets vs vars.** Misuse, scope errors.
- **Shell safety.** Multi-line bash blocks without `set -euo pipefail`; shell interpolation bugs in called scripts.
- **Cache key correctness.** Two jobs writing the same cache key with different contents (poisoning each other).

## Security — expert-level critical review

Anchor every finding to the [GitHub Actions Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use). The rubric below is grouped by the same themes that doc uses; cite the doc plus the specific line/file for every finding. Where relevant, also map the finding to an OWASP Top 10 CI/CD risk or an OpenSSF Scorecard check.

### Action pinning & third-party supply chain
- **Action pinning.** Third-party actions MUST be pinned to a full commit SHA with a comment noting the version tag (`uses: org/action@<40-char-sha> # v1.2.3`). Per the GitHub doc, SHA pinning is "currently the only way to use an action as an immutable release" — tag pinning is bypassable by repo compromise (tags can be moved or deleted). Any unpinned third-party action is at minimum a High finding. The [tj-actions/changed-files compromise (March 2025)](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised) is the canonical case for why this matters.
- **Verify the SHA.** Confirm the pinned SHA is from the action's canonical repository, not a fork.
- **Official vs third-party.** Official `actions/*` and verified-creator actions may use major tags, but SHA is preferred even for those.
- **Reusable workflows.** Same supply-chain rules apply — pin remote `uses: org/repo/.github/workflows/foo.yml@<sha>`.
- **Provenance signals.** Unknown publishers, unverified authors, archived repos, recent maintainer changes, low star/install counts on a security-sensitive action — flag as concerns even when otherwise pinned.
- **Dependabot for actions.** `.github/dependabot.yml` should include `package-ecosystem: github-actions`. Note: Dependabot only opens version-update PRs for semver-pinned actions — SHA-pinned actions don't generate Dependabot alerts. Mitigation is the SHA-with-version-comment pattern (Dependabot updates the comment along with the SHA).
- **Dependency review on PRs.** PRs touching `.github/` should run `actions/dependency-review-action` to flag vulnerable transitive action versions before merge.

### Secret hygiene
- **Plaintext secrets in workflow files.** Hardcoded credentials or tokens in YAML are Critical. Use repo / org / environment secrets.
- **Structured data as a single secret is broken.** JSON, XML, YAML blobs encapsulating multiple values cause log redaction to fail (redaction is exact-string match). Per the GitHub doc, split into individual secrets per sensitive value. Flag any secret whose name suggests a blob (`*_JSON`, `*_CONFIG`, `*_BUNDLE`).
- **Generated/derived secrets must be re-masked.** When a workflow derives a value from a secret (signed JWT, base64-re-encoded key, OAuth code exchange, decrypted blob), register the derived value with `echo "::add-mask::$VALUE"` before the next step uses it. Otherwise it leaks in logs.
- **`echo` of secrets** (even temporarily, even in a debugging step left behind) is a Critical finding. Same for unredacted secrets in step outputs, error messages, or environment dumps.
- **Secrets in `if:` expressions.** Expressions evaluate before redaction and can leak via the workflow run UI. Flag any `if:` referencing `secrets.*`.
- **Exposure response.** If unredacted secrets appeared in any prior run's logs, the secret is compromised — delete the log and rotate. Note this as the documented response procedure, not a maybe.
- **Environment-scoped secrets with required reviewers.** Sensitive secrets (production deploy keys, signing keys, third-party API keys with destructive scope) should live in environment-scoped secrets with required reviewers and deployment-branch restrictions, not as repo or org secrets. Flag prod-deploy workflows that use repo secrets directly.

### Workflow code injection
- **Script injection via `${{ ... }}` interpolation.** Any `${{ github.event.* }}`, `${{ github.head_ref }}`, `${{ inputs.* }}`, `${{ github.event.pull_request.title }}`, `${{ github.event.comment.body }}`, `${{ github.event.issue.title }}` (or any other user-controllable context value) interpolated directly into a `run:` block is a High finding (Critical if the workflow has elevated permissions or runs on `pull_request_target`). Fix per the GitHub doc: pass via an `env:` mapping and reference `"$VAR"` (double-quoted), with `set -euo pipefail` upstream. Better still, use a JavaScript or composite action that takes the value as an argument.
- **`pull_request_target` + checkout of PR head.** Classic RCE vector — `pull_request_target` runs with write permissions and access to repo secrets, and a malicious PR can inject code that runs in that context. **Critical.**
- **`workflow_run` trigger.** Verify it does not execute untrusted PR code with elevated privileges from the triggering workflow's context.
- **`persist-credentials: true`** on `actions/checkout` when the job does not push — leaves the `GITHUB_TOKEN` on disk and reachable from any subsequent step or composite action. Set to `false` unless explicitly needed for `git push`.
- **Cache poisoning.** PR-writable caches (`actions/cache` keyed on PR-controllable values) consumed by trusted workflows can be poisoned by an attacker PR. Scope cache keys to the trigger; never let a PR run write a cache key that a `main` run or a privileged workflow reads.

### Permissions, OIDC, and access surface
- **`permissions:` block.** Every workflow should declare minimum permissions explicitly at the workflow or job level. A workflow without one is a Medium finding (org defaults vary but historically default to write-all). Recommend `permissions: contents: read` as the workflow-level default and elevate per-job only where needed.
- **`GITHUB_TOKEN` scope vs need.** Common over-grants: `contents: write` on read-only test jobs, `pull-requests: write` on jobs that don't comment, `id-token: write` outside an OIDC step. Tighten per-job.
- **OIDC for cloud authentication.** Long-lived cloud credentials (AWS access keys, GCP service-account JSON, Azure SPN secrets) stored as repo secrets is a Medium finding when the provider supports OIDC — recommend the official OIDC integrations (`aws-actions/configure-aws-credentials`, `google-github-actions/auth`, `azure/login` with federated credentials) with `permissions: id-token: write` scoped to the deploy job. OIDC eliminates the standing credential entirely.
- **Environments + required reviewers.** Production deployment workflows should target an environment (`environment: production`) with required reviewers and deployment-branch restrictions configured in repo Settings. Workflows that deploy to prod without environment-gated approval are at minimum Medium.
- **CODEOWNERS for `.github/workflows/`.** The `.github/workflows/` directory should be owned in `CODEOWNERS` by the platform/security team and protected by branch-protection-required-review. Without this, anyone with repo write access can modify CI to exfiltrate secrets. Medium finding if missing on a repo with non-trivial secrets.
- **Disable Actions creating/approving PRs.** Org or repo setting "Allow GitHub Actions to create and approve pull requests" should be off unless an automation explicitly requires it. Self-approving CI bots are a known privilege-escalation vector.
- **Audit log for Actions changes.** Recommend periodic review of `org.update_actions_secret`, `repo.actions_enabled`, and runner registration events. Note as a recommendation if not already covered by the org's security tooling.

### Runner risks
- **GitHub-hosted runners** are ephemeral and isolated — the default safe choice. Per-image SBOMs are published at `actions/runner-images/releases` for supply-chain review.
- **Self-hosted runners** are persistent unless explicitly ephemeral. Per the GitHub doc: **never use self-hosted runners on public repositories** — any user can open a PR that compromises the runner host. Internal/private repos still require care because forks and PRs from anyone with read access execute on the runner. Flag any self-hosted runner on a public repo as Critical.
- **JIT (Just-In-Time) ephemeral runners.** If self-hosted is required, prefer the JIT REST API pattern (`POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig`) that creates a single-job, self-destroying runner. Note the caveat: hardware reuse for JIT runners can leak between jobs unless automation provides a clean environment each time.
- **Runner groups.** Multi-repo / org-level self-hosted runners must be partitioned into runner groups with explicit repo allowlists. A runner group accessible to many repos is a cross-tenant compromise vector.
- **Runner host hygiene.** Self-hosted runners with cloud-instance metadata access (AWS IMDSv2, GCP metadata service) are a credential-exfiltration risk if any workflow runs untrusted code. Lock down with IAM, IMDSv2-only, and `harden-runner` egress policies.

### Detection & tooling
Recommend concrete additions to CI when gaps are found:
- **`zizmor`** ([woodruffw/zizmor](https://github.com/woodruffw/zizmor)) — static analyzer specifically for GitHub Actions security. Catches script injection, dangerous triggers, permissions over-grants, and many of the items above. Recommend as a CI step or pre-commit hook.
- **`actionlint`** ([rhysd/actionlint](https://github.com/rhysd/actionlint)) — syntactic linter with shellcheck integration for `run:` blocks. Complement to zizmor (correctness, not security).
- **`step-security/harden-runner`** — egress filtering and audit for what each workflow contacts at runtime. Recommended for repos with elevated permissions or sensitive secrets.
- **`actions/dependency-review-action`** — PR-time dependency vulnerability gate.
- **OpenSSF Scorecard** ([scorecard.dev](https://scorecard.dev/) / [scorecard-action](https://github.com/ossf/scorecard-action)) — automated check suite covering pinned-actions, token-permissions, dangerous-workflow, and several other items in this rubric. Recommend especially for repos that publish actions or have high supply-chain exposure.
- **Repository security advisories.** For repos that publish actions consumed by others: enable private vulnerability reporting and use repository security advisories.

## Maintainability

- DRY: repeated setup steps across workflows → candidates for composite action or reusable workflow.
- Naming, step comments, workflow-level documentation.

# PHASE 3 — REPORT

Produce a single structured report with these sections:

## Section A — Safe Optimizations (functionality-preserving)

Numbered list. For each: file path, line range, before snippet, after snippet, one-line rationale, expected impact (time saved / cost saved / risk reduced). These are the ONLY changes you may offer to apply automatically.

## Section B — Additional Improvements (judgment calls)

Things that add value but change behavior, add new workflows, or require team decisions. Do NOT offer to implement these automatically.

At the end of Section B, produce a ready-to-paste follow-up prompt I can use in a fresh Claude Code session to have you implement the full list (or an easily-editable subset).

## Section C — Bugs & Security Findings

Ordered by severity. For each: file + lines, description, concrete exploit or failure scenario, recommended fix. Do NOT offer to implement these automatically.

At the end of Section C, produce a ready-to-paste follow-up prompt to address the findings.

## Section D — Summary

- Top 3 quick wins
- Estimated CI time saved per PR run (rough)
- Estimated monthly cost delta (rough — note assumptions)
- Single most important security finding, if any

# PHASE 4 — IMPLEMENTATION

After presenting the report, ASK whether to proceed with Section A changes. If approved, apply them as a single coherent commit's worth of edits, then output:
- A suggested commit message (conventional-commits style)
- A suggested PR description summarizing the changes and expected impact

Do nothing from Section B or C without an explicit new request.

# CONSTRAINTS

- Do not modify any file before I approve Section A.
- Do not delete or disable workflows.
- Do not invent third-party action capabilities — fetch the action if uncertain.
- Quote specific lines when making findings; avoid generic advice.
- Read scripts referenced by workflows before judging the workflow.
- Where Blacksmith-native patterns differ from generic GitHub Actions patterns, prefer Blacksmith-native when Blacksmith is already in use.
- Do not blanket-apply `cancel-in-progress: true` to deploy workflows on protected branches.
````

---

## Notes on Using It

A few things to tune per repo:

- For repos that are mostly **Godot + Android** (e.g. Nanisca), the caching wins will be bigger than typical — Gradle caches and Godot export templates are expensive to rebuild. Be extra-skeptical of Section A findings there since a wrong cache key can silently serve stale builds.
- For repos already on Blacksmith, the first pass of Section A is usually "swap `actions/cache` → `useblacksmith/cache` and drop a `setup-node` node_modules dance that Blacksmith handles natively." Expect chunky wins.
- The follow-up prompts in Section B and C will be scoped to that specific repo's findings, so no need to template them here — Claude Code writes them based on what it found.

---

## Reference Material

### GitHub-published guidance (authoritative baseline)

- [GitHub Actions — Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use) — **the canonical doc the Security rubric maps to.** When this updates, the prompt and skill should follow.
- [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions) — broader hardening guide; overlaps with the secure-use doc and fills in detail on token scopes and runner risks.
- [About security hardening with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) — the OIDC pattern the rubric prefers over long-lived cloud credentials.
- [Keeping your actions up to date with Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot) — version-update mechanics and the SHA-pinning caveat.

### Vendor-neutral standards & frameworks

- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/) — the canonical CI/CD threat taxonomy (insufficient flow control, dependency chain abuse, poisoned pipeline execution, etc.). Useful for vendor-neutral framing of findings.
- [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/) — provenance and build-integrity levels; relevant for repos that publish actions or release software downstream.
- [OpenSSF Scorecard](https://scorecard.dev/) and [Scorecard action](https://github.com/ossf/scorecard-action) — automated check suite for supply-chain hygiene; directly recommended in the GitHub doc.

### Practical guidance & case studies

- [StepSecurity — tj-actions/changed-files compromise (March 2025)](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised) — canonical real-world example of why SHA pinning matters and how `harden-runner` egress filtering caught it.
- [GitHub Security blog — supply-chain category](https://github.blog/security/supply-chain-security/) — case studies and updates on supply-chain protections.
- [GitHub: protecting your runner image supply chain via SBOM](https://github.com/actions/runner-images/releases) — per-image SBOMs for GitHub-hosted runners.

### Tooling recommended in the rubric

- [`zizmor`](https://github.com/woodruffw/zizmor) — static analyzer for GitHub Actions security.
- [`actionlint`](https://github.com/rhysd/actionlint) — syntactic + shellcheck linter for workflows.
- [`step-security/harden-runner`](https://github.com/step-security/harden-runner) — runtime egress audit and policy enforcement.
- [`actions/dependency-review-action`](https://github.com/actions/dependency-review-action) — PR-time dependency-vulnerability gate.

### Cost & performance (existing references)

- [Blacksmith: How to reduce spend in GitHub Actions](https://www.blacksmith.sh/blog/how-to-reduce-spend-in-github-actions)
- [Blacksmith: Protect prod, cut costs — concurrency in GitHub Actions](https://www.blacksmith.sh/blog/protect-prod-cut-costs-concurrency-in-github-actions)
