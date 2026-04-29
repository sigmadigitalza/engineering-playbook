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

- **Action pinning.** Third-party actions MUST be pinned to a full commit SHA, with a comment noting the version tag. Official `actions/*` and verified-creator actions may use major tags, but SHA is preferred. Any unpinned third-party action is at minimum a High finding.
- **`permissions:` block.** Every workflow should declare minimum permissions. A workflow without one is a Medium finding (defaults vary by org but tend toward write-all).
- **`pull_request_target` + checkout of PR head.** Classic RCE vector. Flag as Critical.
- **Script injection.** Any `${{ github.event.* }}`, `${{ github.head_ref }}`, `${{ inputs.* }}` or user-controllable input interpolated directly into a `run:` block is a High finding. Fix: pass via env var and reference `"$VAR"`.
- **Secret handling.** `echo` of secrets, secrets in log output, secrets in `if:` expressions where they may print.
- **`workflow_run` trigger.** Verify it does not run with elevated privileges against untrusted PR code.
- **`persist-credentials: true`** on checkout when the job does not push — flag.
- **Third-party action supply chain.** Unknown publishers? Unverified? Archived repos? Recent maintainer changes?
- **`GITHUB_TOKEN` scope** vs what the job actually needs.
- **Cache poisoning.** PR-writable caches used by trusted workflows.

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

- [Blacksmith: How to reduce spend in GitHub Actions](https://www.blacksmith.sh/blog/how-to-reduce-spend-in-github-actions)
- [Blacksmith: Protect prod, cut costs — concurrency in GitHub Actions](https://www.blacksmith.sh/blog/protect-prod-cut-costs-concurrency-in-github-actions)
