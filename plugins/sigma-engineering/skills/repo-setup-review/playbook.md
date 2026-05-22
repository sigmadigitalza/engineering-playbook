# Git Repo Setup & Review Playbook

A strategy and Claude Code prompt for auditing or bootstrapping a GitHub repo's *configuration* surface — branch and tag rulesets, CODEOWNERS, collaborator roles, default token scope, secret scanning, contribution gates, merge settings — separately from the workflow YAML inside it. Posture-aware (open-source / public-distribution / private-team / personal). Companion to `github-actions-review`.

---

## Strategy

**Workflow review and repo-configuration review are different jobs.** `github-actions-review` covers the YAML *inside* `.github/workflows/`. This playbook covers what surrounds those workflows: who can push, what ruleset gates the default branch, who owns the code, whether the floating major-version tag can be force-pushed, which app installations get to bypass review. A perfectly-hardened workflow file inside a perfectly-permissive repo configuration is still a single push from compromise — the supply-chain blast radius depends on both. Pair these two playbooks for any release-engineering repo.

**Reconnaissance before recommendations.** Same shape as the workflow playbook — push Claude Code through inventory before analysis. Repo config has more knobs than people realise (visibility, archived, default branch, fork policy, sha-pinning enforcement, default GITHUB_TOKEN scope, can-Actions-approve-PRs, classic branch protection, rulesets, tag rulesets, secret scanning, push protection, custom-pattern scanning, dependabot tiers, interaction limits, CODEOWNERS, environments, deploy keys, webhook secrets). A reviewer who starts editing settings without enumerating runs out of context fast.

**Posture is the unlock.** "Good" for a public open-source project that wants drive-by contributions is *very* different from "good" for a public-but-closed-to-randos library that just happens to be readable for distribution. The same `has_issues: false` is correct for one and wrong for the other. The prompt asks for the posture up front and routes rubric weights through it.

The four postures the playbook recognises:
- **Public, open-source.** Visible, contributions welcome, drive-by PRs expected. Issues/Discussions ON. CODEOWNERS optional. CONTRIBUTING.md required. Strong CI gate but generous review-from-maintainer requirements.
- **Public, distribution-only.** Visible because consumers need to read/pin/fork, but contributions not solicited. Issues OFF. Discussions OFF. CODEOWNERS strict. Branch protection paranoid. This is the rational-release / kit posture.
- **Private team.** Read-restricted, team-shared. Issues ON. CODEOWNERS scoped to teams. Mid-strength protection. Friction tuned for velocity.
- **Private personal.** Single-owner, no team. Most settings collapse to "do whatever's convenient." Still want CODEOWNERS for future-you and branch protection so a moment of carelessness doesn't nuke main.

**Rulesets vs classic branch protection — check both.** A common reviewer mistake (one this playbook explicitly catches): `gh api repos/.../branches/main/protection` returns HTTP 404, so reviewer concludes "main is unprotected" and writes that finding. But the repo may have a *ruleset* covering main with most of the protections. Rulesets are the newer, superseding system; classic branch protection still exists. Always query both endpoints:
- Classic: `gh api repos/.../branches/main/protection`
- Rulesets: `gh api repos/.../rulesets` then drill into each

If only one is configured, the other endpoint will return empty/404. Never trust a single endpoint as evidence of "unprotected."

**The floating-major-tag fanout pattern.** Repos that publish reusable workflows or actions are typically pinned by consumers to a *floating* major-version tag (`@v1`) that the repo's own release workflow force-updates on every release. That tag is not a branch — it's not covered by branch protection or branch rulesets. It's covered by *tag* rulesets, which most reviewers forget. For these repos, tag protection on `refs/tags/v*` is the highest-impact single configuration change, often higher than main branch protection, because tag mutation fans out to every consumer's next push without any review step on the consumer side. Always check the tag-protection surface first for any repo that distributes reusable workflows, actions, or libraries via floating tags.

**The github-actions[bot] bypass quirk is UI-only for built-in apps.** GitHub's ruleset bypass API accepts `actor_type: "Integration"` with the app's database ID — *for third-party apps installed in the org*. The built-in github-actions integration (app id `15368`) is rejected with `"Actor GitHub Actions integration must be part of the ruleset source or owner organization"`. The Web UI's bypass picker has special handling for built-in apps that the REST API does not expose. This means: any ruleset rule that the release bot must bypass (e.g., `pull_request` on main when cut-release pushes a finalise commit directly; `update` on tags when cut-release force-updates `v1`) can only be applied at all if the user adds the github-actions bypass via the UI. The prompt has to flag this as a known UI-only step rather than silently fail at apply time. Until/unless GitHub closes the API gap, this is the single most surprising trap.

**Three-bucket reporting same as github-actions-review.** Section A — pure-config gh-api calls that don't change behavior (safe to auto-apply). Section B — judgment calls with team/posture decisions. Section C — security findings ordered by severity. Plus a fourth, explicit section: **D — UI-only steps**. This is where rules that need built-in-app bypass land, plus settings that GitHub doesn't expose via stable APIs.

**Bypass-mode discipline.** When the prompt does recommend bypass_actors, it has to choose between `bypass_mode: "always"` and `bypass_mode: "pull_request"`. Default to `always` for release bots that push directly. `pull_request` mode only covers merging unreviewed PRs, not direct pushes — picking the wrong one is the second-most-common trap after assuming classic-branch-protection covers everything.

**Distinguish "admins" from "the bot."** `OrganizationAdmin` and `RepositoryRole: 5` (admin) bypass actors give bypass to every human admin in scope — including any colleagues with org-wide admin access. That's appropriate for break-glass scenarios. It is *not* a substitute for github-actions bypass, because the bot's actor identity is `github-actions[bot]` and doesn't carry org/repo-admin role. The two bypass types serve different purposes; the prompt recommends *both* together for release-engineering repos (bot bypass for the workflow, admin bypass for emergency human override).

**CODEOWNERS is the cheapest leverage and the most under-used.** A two-line file (`* @owner` plus a comment block) combined with `require_code_owner_review: true` in the main ruleset converts "anyone with write can merge" into "every merge requires the owner." For personal/small-team repos this is often the single most important change after fixing tag protection. The prompt walks the user through CODEOWNERS as a precondition for several other rules.

**Conservative defaults for the dangerous toggles.** A few settings can silently widen attack surface and the prompt has to call them out specifically:
- `default_workflow_permissions: write` (the repo-level GITHUB_TOKEN default). Should be `read`. Workflows that need write declare it explicitly.
- `can_approve_pull_request_reviews: true`. Required for any workflow that uses `gh pr create`, but pairs with branch-protection-requires-human-review to make bot self-approval useless.
- `sha_pinning_required: false` (the repo policy that enforces Action SHA-pinning). Should be `true` once existing workflows are already SHA-pinned.
- `secret_scanning` and `secret_scanning_push_protection` on public repos. Free, no reason to leave off.
- `delete_branch_on_merge: false`. Low-stakes but accumulates branch clutter; turn on once branch protection exists.
- Three merge methods all enabled (`allow_squash_merge`, `allow_merge_commit`, `allow_rebase_merge`). Squash-only is cleaner for repos whose changelog derives from PR titles.

**Don't silently break the release flow.** The prompt explicitly checks whether the repo has a release workflow (`cut-release`, `release-please`, `semantic-release`, etc.) that pushes to main or force-updates tags. If so, every protection rule that affects those operations needs paired bypass actors, and the prompt has to *say so* rather than apply protections and let the next release fail mid-pipeline.

---

## The Prompt

Paste the block below into Claude Code, run from the repo root (or from anywhere with `gh` authenticated against the target repo).

````markdown
You are a senior platform engineer specializing in GitHub repo configuration, branch and tag protection, supply-chain security, and the trade-offs between repo posture (open-source vs distribution-only vs private) and contribution friction. Assume an adversarial, critical review posture. Cite the exact `gh api` endpoint and JSON field for every finding. Do not summarize or hedge where you can be specific.

# SCOPE

Review the configuration surface of a single GitHub repo:
- Repo-level settings (visibility, features, merge policy, security & analysis)
- Branch protection — *both* classic and rulesets
- Tag protection — *both* classic and rulesets
- Collaborator and org-admin surface
- Actions permissions (default token scope, allowed actions, SHA-pinning enforcement, can-approve-PRs)
- CODEOWNERS, dependabot config, SECURITY.md
- Environments + deployment-branch restrictions
- Webhook secrets if accessible

Do NOT review the YAML inside `.github/workflows/` — that's the job of the `github-actions-review` playbook. If you find workflow-internal issues while doing reconnaissance, note them and recommend running that playbook separately.

# PHASE 0 — POSTURE DETECTION

Ask the user which posture applies. Do not assume from the visibility flag alone.

1. **Public, open-source.** Visible, contributions welcome, drive-by PRs expected.
2. **Public, distribution-only.** Visible because consumers need to read/pin/fork, but contributions not solicited; only personal-friends-or-team collaboration.
3. **Private team.** Read-restricted, team-shared.
4. **Private personal.** Single-owner.

If unclear, ask. The same setting can be a critical finding under one posture and a no-op under another.

# PHASE 1 — RECONNAISSANCE

Do this first. Report a brief summary before doing any analysis. Use `gh api` for everything; do not infer from the web UI.

1. **Repo basics.** `gh api repos/:owner/:repo` — capture `visibility`, `default_branch`, `archived`, `disabled`, `has_issues`, `has_wiki`, `has_discussions`, `has_projects`, `allow_forking`, `web_commit_signoff_required`, all `allow_*_merge`, `delete_branch_on_merge`, `allow_auto_merge`, `use_squash_pr_title_as_default`, `security_and_analysis.*`, `forks_count`, `open_issues_count`.
2. **Default branch protection — check BOTH endpoints.**
   - Classic: `gh api repos/:owner/:repo/branches/<default>/protection` (HTTP 404 means "no classic protection" — does NOT mean "unprotected").
   - Rulesets: `gh api repos/:owner/:repo/rulesets` and drill into each with `gh api repos/:owner/:repo/rulesets/<id>`.
3. **Tag protection — same pattern.**
   - Classic (deprecated): `gh api repos/:owner/:repo/tags/protection`.
   - Rulesets: filter the rulesets list for `target == "tag"`.
4. **Actions permissions.**
   - `gh api repos/:owner/:repo/actions/permissions` — capture `enabled`, `allowed_actions`, `sha_pinning_required`.
   - `gh api repos/:owner/:repo/actions/permissions/workflow` — capture `default_workflow_permissions`, `can_approve_pull_request_reviews`.
5. **Collaborators + org-admin surface.**
   - `gh api repos/:owner/:repo/collaborators` — note role of each.
   - If the repo is in an org, ask whether org admins inherit repo admin (almost always yes).
6. **CODEOWNERS + dependabot + security policy.** Check `.github/CODEOWNERS` (or `CODEOWNERS` at root or in `docs/`), `.github/dependabot.yml`, `SECURITY.md`, and presence of `.github/CONTRIBUTING.md` / `PULL_REQUEST_TEMPLATE.md`.
7. **Release-workflow detection.** Is there a workflow that pushes to default branch (commit) or force-updates tags (floating major)? Look for `cut-release.yml`, `release-please`, `semantic-release`, or any `git push` / `git tag -f` in `.github/workflows/*.yml`. Note ALL such operations — every one needs a bypass actor on the eventual ruleset.
8. **Distribution model.** Does the repo publish reusable workflows, composite actions, JSR/NPM packages, or anything else consumers pin to a floating tag (`@v1`)? If yes, tag protection is the highest-priority finding category.
9. **Vulnerability reporting / scanning.** `gh api repos/:owner/:repo/private-vulnerability-reporting` and `gh api -i repos/:owner/:repo/vulnerability-alerts` (204 = enabled).

Report a posture-tagged snapshot:

| Knob | Current | Aligned with <posture>? |
|---|---|---|

Use ✅ / ⚠️ / ❌ in the third column.

# PHASE 2 — ANALYSIS RUBRIC

For each finding, record: setting/endpoint, severity (Critical/High/Medium/Low/Nit), and one of:
- **SAFE** — pure config, no behavior change, can be applied via single `gh api` call.
- **JUDGMENT** — posture decision, collaborator role change, or has downstream consequences.
- **SECURITY** — security finding.
- **UI-ONLY** — requires manual web UI step because the public API doesn't expose the necessary actor type (most common case: github-actions bypass on rulesets).

## Branch protection / rulesets — default branch

Anchor to the [GitHub branch protection rules reference](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets).

- **Pull request required to merge.** `pull_request` rule on the default branch. Without it, anyone with push access can push directly. Critical for any non-personal posture. Required parameters to grade:
  - `required_approving_review_count` (≥1)
  - `dismiss_stale_reviews_on_push` (true)
  - `require_code_owner_review` (true if CODEOWNERS exists)
  - `require_last_push_approval` (true — closes the "approve, then push more" gap)
  - `required_review_thread_resolution` (true)
  - `allowed_merge_methods` (squash-only for changelog-from-PR-title repos)
- **Required status checks.** `required_status_checks` rule. Pull the actual context names from the most recent successful PR and check they're listed. Generic "CI" is not enough — name the specific contexts. `strict_required_status_checks_policy: true` requires the branch to be up to date before merging (good practice, adds friction).
- **Linear history.** `required_linear_history` rule (or implicit via squash-only merge method). Recommended.
- **Force-push protection.** `non_fast_forward` rule. Almost always wanted on the default branch.
- **Deletion protection.** `deletion` rule. Always wanted.
- **CODEOWNERS-gated review.** Combine `require_code_owner_review: true` with a CODEOWNERS file covering at least `.github/` and security-sensitive paths.
- **Apply-to-administrators / no exemption.** For rulesets: `bypass_actors: []` (no bypass) or only the release bot. For classic branch protection: `enforce_admins.enabled = true`. Without this, admins silently sidestep every rule.
- **Bypass actors for the release bot.** If a release workflow pushes to default branch directly (e.g., a "finalise changelog" commit), the github-actions[bot] needs explicit bypass. ⚠️ UI-ONLY for built-in github-actions app — the public API rejects `actor_type: Integration, actor_id: 15368` with `"Actor GitHub Actions integration must be part of the ruleset source or owner organization"`. Flag any ruleset finding that requires this bypass as UI-ONLY and provide the click path.

## Tag protection / rulesets

For repos that publish reusable workflows or actions consumed via floating `@vN` tags, this is the highest-impact category. Floating-tag fanout is *faster* than main-branch compromise because no review-PR-and-merge dance is required to push a malicious tag.

- **Ruleset target `tag` covering `refs/tags/v*`** (or whichever pattern the repo uses for distribution tags).
- **Deletion blocked.** `deletion` rule. Always wanted — accidental tag deletion breaks every consumer.
- **Update blocked.** `update` rule. Blocks force-update of an existing tag. ⚠️ UI-ONLY bypass for the release bot — same trap as above.
- **No bypass for tags except the release bot.** Specifically *do not* recommend `OrganizationAdmin` bypass on tag rulesets if a colleague-admin could update them by mistake.

## Collaborator surface

- **Each admin is a compromise path.** Enumerate. For each, ask the user whether the role is intentional. Recommend `maintain` over `admin` for trusted collaborators — `maintain` covers issues/labels/PRs but cannot change settings, install apps, manage secrets, or modify protected branches' rules.
- **Org-admin spillover.** Repos in an org typically grant repo-admin to every org admin. The user can't change this from the repo; flag for org-level decision.
- **Outside collaborators with write or above.** Should be zero for distribution-only/personal posture.

## Default token scope + Actions surface

- **`default_workflow_permissions: write`** is the wrong default. Should be `read`. Workflows that need write declare it explicitly in `permissions:`. Even with explicit blocks everywhere today, a future workflow that forgets one will silently inherit write.
- **`can_approve_pull_request_reviews: true`** is needed if any workflow uses `gh pr create` (most release automations do). Pair with branch-protection-requires-human-review so bot approval is useless for merge. Document the dependency so a future reviewer doesn't toggle it off and break release.
- **`sha_pinning_required: false`** should be `true` once existing workflows are already SHA-pinned. Converts policy into enforcement.
- **`allowed_actions: "all"`** is acceptable for most projects. Tighten to `selected` only if the repo has strong supply-chain requirements and the maintainer can manage an allowlist.

## Secret & vulnerability hygiene

- **Secret scanning OFF on a public repo** — Critical, near-zero-cost fix. `gh api -X PATCH repos/:owner/:repo` with `security_and_analysis.secret_scanning.status=enabled`.
- **Push protection OFF on a public repo** — similar. `secret_scanning_push_protection.status=enabled`. Stops accidental secret commits at push time.
- **Dependabot security updates OFF** — should be on.
- **Vulnerability alerts OFF** — should be on (`PUT /repos/:owner/:repo/vulnerability-alerts`).
- **Private vulnerability reporting OFF** for any public repo — should be on. Gives researchers a private channel.

## Contribution surface vs posture

- **`has_issues: true` for distribution-only posture** — Medium finding. Random users open issues you don't intend to triage.
- **`has_discussions: true` for distribution-only or personal posture** — same.
- **`has_wiki: true`** — rarely worth it; usually a maintenance burden.
- **`has_projects: true`** — only useful for actively-managed projects.
- **`has_issues: false` for open-source posture** — wrong, the project loses its bug-report channel.
- **No CONTRIBUTING.md or PULL_REQUEST_TEMPLATE.md for open-source posture** — Medium.

## CODEOWNERS

- **File absent** — Medium finding for any non-personal posture; High if branch protection requires CODEOWNERS review (the rule fails open).
- **File present but coverage thin** — flag specifically. Minimum coverage: `.github/` (workflows), the build/manifest files (`package.json`, `deno.json`, `pyproject.toml`, `go.mod`, etc.), and any security-sensitive directories (auth, signing, deploy).
- **Catch-all `* @owner` is fine for personal/small-team posture.** Larger team posture wants granular paths.

## Merge & branch hygiene

- **All three merge methods enabled** — recommend squash-only if changelog/release notes derive from PR titles.
- **`delete_branch_on_merge: false`** — flip to `true` after first stable release. Reduces clutter.
- **`allow_auto_merge: true` without branch protection** — Critical. Auto-merge would let a single approval merge anything green.
- **`web_commit_signoff_required: true`** — DCO compliance. Optional unless project policy requires.

# PHASE 3 — REPORT

Produce a single structured report with these sections.

## Section A — Safe optimizations (functionality-preserving)

Numbered list. For each: setting, current → target value, `gh api` one-liner to apply, one-line rationale, expected impact. These are the ONLY changes you may offer to apply automatically.

At the end of Section A, produce a single bash block that applies all Section A items in sequence so the user can paste and run.

## Section B — Improvements requiring decisions

Posture choices, collaborator role demotions, contribution-surface changes. Do NOT offer to implement these automatically.

## Section C — Bugs & security findings

Ordered by severity. For each: setting/endpoint, description, exploit/failure scenario, recommended fix (API call if possible, manual UI step if not), and posture-tagged severity rationale.

## Section D — UI-only steps

Rules and settings that require the GitHub Web UI because the public REST API doesn't expose the necessary actor type. Almost always the github-actions[bot] bypass on rulesets. For each: where to click, what to add, what to verify after.

## Section E — Summary

- Top 3 quick wins (where "win" weights *security* × *implementation cost* × *posture-alignment*).
- The single most important security finding, posture-tagged.
- Distribution-tag fanout — present or absent? If present, name the tag and the consumers affected.
- Open questions for the user that block further hardening.

# PHASE 4 — IMPLEMENTATION

After presenting the report, ASK whether to proceed with Section A changes. If approved, apply them with the bash block from Section A. After each step, verify by re-reading the corresponding `gh api` endpoint and confirm the value flipped.

Do nothing from Sections B, C, or D without an explicit new request.

For Section D items, output a copy-paste UI walkthrough: "Settings → … → click X → search for Y → tick Z → Save."

# CONSTRAINTS

- Do not modify any setting before Section A is approved.
- Never disable a rule that protects the default branch or a release tag without an explicit replacement.
- Do not delete or downgrade collaborator roles without confirming with the user.
- Do not assume a setting just because the web UI shows it — query the API.
- Quote the exact `gh api` endpoint and JSON field for every finding.
- When recommending bypass actors, default to `bypass_mode: "always"` for release bots and `bypass_mode: "pull_request"` only when the bypass is for merge-without-review (not direct push).
- For the github-actions[bot] bypass on rulesets, do NOT attempt the REST API call — it fails with `"Actor GitHub Actions integration must be part of the ruleset source or owner organization"`. Mark these UI-ONLY and provide the click path.
- Always check both classic branch protection AND rulesets. Never declare "unprotected" based on one endpoint.
- Always check both default-branch AND tag protection. For distribution repos pinned via floating tags, tag protection is the higher-impact category.
````

---

## Notes on Using It

A few things to tune per repo:

- **Distribution repos first.** If the repo publishes reusable workflows or actions consumed via floating `@vN` tags (rational-release, kit-style repos), run Phase 1 step 8 *first* and treat tag protection as the highest-priority category. The github-actions[bot] bypass UI step is unavoidable; don't apologise for it, just provide the click path.
- **Personal repos.** Most Section A items still apply (CODEOWNERS, default token scope, secret scanning). Section B's collaborator/contribution questions usually collapse to "the owner."
- **Public, open-source.** Issues / discussions / CONTRIBUTING.md flip to the other side of the rubric. Drive-by PRs expected, so branch protection needs care to not block forks unnecessarily — never require CODEOWNERS approval as the *only* gate (set `required_approving_review_count` ≥ 1 and let any maintainer approve).
- **Pairs with `github-actions-review`.** If the workflow audit finds the kind of issue that depends on repo configuration (e.g., "no concurrency", "no CODEOWNERS to gate workflow changes"), follow up with this playbook on the same repo. The two are designed to be run back-to-back for full coverage.
- **The github-actions[bot] bypass gap may close.** If GitHub adds API support for selecting the built-in github-actions integration as a bypass actor, the UI-ONLY section shrinks. Until then, accept the manual step.

---

## Reference Material

### GitHub-published guidance (authoritative baseline)

- [GitHub branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) — classic branch protection model.
- [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) — newer, superseding protection mechanism. Supports tag rulesets, bypass actors, and more granular targeting.
- [Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository) — UI walkthrough including the bypass-actors picker.
- [Repository ruleset API](https://docs.github.com/en/rest/repos/rules) — REST endpoints for create/list/update/delete.
- [About code owners](https://docs.github.com/en/repositories/managing-your-repositories-settings-and-customizations/customizing-your-repository/about-code-owners) — CODEOWNERS syntax and file-location precedence.
- [GitHub Actions Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use) — the canonical doc that the `github-actions-review` playbook anchors to; relevant here for the default-token-scope and can-approve-PRs settings.
- [Configuring private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository).

### Vendor-neutral standards & frameworks

- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/) — *CICD-SEC-1 Insufficient Flow Control* and *CICD-SEC-2 Inadequate Identity and Access Management* both map directly into this playbook.
- [OpenSSF Scorecard](https://scorecard.dev/) — automates the `Branch-Protection`, `Code-Review`, `Token-Permissions`, and `Pinned-Dependencies` checks among others. Recommended as a periodic gate for repos that publish a package or action.

### Practical guidance

- [GitHub: keeping your actions up to date with Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot) — the SHA-with-version-comment pattern this playbook recommends in concert with `sha_pinning_required: true`.
- [GitHub: managing security and analysis settings](https://docs.github.com/en/repositories/managing-your-repositories-settings-and-customizations/customizing-your-repository/managing-security-and-analysis-settings-for-your-repository) — the secret scanning / push protection / dependabot toggles surfaced in Phase 1.

### Companion playbooks

- [`github-actions-review`](./github-actions-review.md) — workflow YAML audit. Pair with this playbook for full coverage of a release-engineering repo.
- [`web-security`](./web-security.md) — application security; some overlap on the secrets-in-source-control class of findings.
