# Repo Setup & Review Prompt

Paste into Claude Code, run from the repo root (or from anywhere with `gh` authenticated against the target repo).

---

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
- Webhook inventory — enumerate via `gh api repos/:owner/:repo/hooks`. Secret *values* aren't returned, but `config.secret` comes back masked as `********` when one is set — enough to confirm a secret is configured without leaving the API.

Do NOT review the YAML inside `.github/workflows/` — that's the job of the `github-actions-review` playbook. If you find workflow-internal issues while doing reconnaissance, note them and recommend running that playbook separately.

# PHASE 0 — POSTURE DETECTION

Ask the user **two** questions. Do not assume from the visibility flag alone.

**1. Which posture applies?**

1. **Public, open-source.** Visible, contributions welcome, drive-by PRs expected.
2. **Public, distribution-only.** Visible because consumers need to read/pin/fork, but contributions not solicited; only personal-friends-or-team collaboration.
3. **Private team.** Read-restricted, team-shared.
4. **Private personal.** Single-owner.

**2. Is there effectively one active human maintainer, or a meaningful team?**

This second question is independent of visibility and changes the approval-gate recommendation entirely. GitHub forbids users from submitting approving reviews on their own PRs — the "Approve" button is disabled on a PR you authored — so `required_approving_review_count: ≥1` deadlocks a solo maintainer on their own work.

If unclear, ask both. The same setting can be a critical finding under one posture and a no-op under another.

# PHASE 1 — RECONNAISSANCE

Do this first. Report a brief summary before doing any analysis. Use `gh api` for everything; do not infer from the web UI.

1. **Repo basics.** `gh api repos/:owner/:repo` — capture `visibility`, `default_branch`, `archived`, `disabled`, `has_issues`, `has_wiki`, `has_discussions`, `has_projects`, `allow_forking`, `web_commit_signoff_required`, all `allow_*_merge`, `delete_branch_on_merge`, `allow_auto_merge`, `use_squash_pr_title_as_default`, `security_and_analysis.*`, `forks_count`, `open_issues_count`.
2. **Default branch protection — check BOTH endpoints.**
   - Classic: `gh api repos/:owner/:repo/branches/<default>/protection` (HTTP 404 means "no classic protection" — does NOT mean "unprotected").
   - Rulesets: `gh api --paginate repos/:owner/:repo/rulesets` and drill into each with `gh api repos/:owner/:repo/rulesets/<id>`.
3. **Tag protection — same pattern.**
   - Classic (removed — sunset 2024-08-30; `gh api repos/:owner/:repo/tags/protection` now returns an error, GitHub auto-migrated tag protections to rulesets). Only relevant for un-migrated legacy state; read tag protection from the tag-target rulesets below instead.
   - Rulesets: filter the rulesets list for `target == "tag"`.
4. **Actions permissions.**
   - `gh api repos/:owner/:repo/actions/permissions` — capture `enabled`, `allowed_actions`, `sha_pinning_required`.
   - `gh api repos/:owner/:repo/actions/permissions/workflow` — capture `default_workflow_permissions`, `can_approve_pull_request_reviews`.
5. **Collaborators + org-admin surface.**
   - `gh api --paginate repos/:owner/:repo/collaborators` — note role of each.
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
- **WORKFLOW REDESIGN** — cannot be solved with `gh api` alone; needs a custom GitHub App, a PAT, or restructuring a workflow. Most common case: the release bot needs to bypass a rule but `github-actions[bot]` isn't a valid bypass actor.

## Branch protection / rulesets — default branch

Anchor to the [GitHub branch protection rules reference](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets).

- **Pull request required to merge.** `pull_request` rule on the default branch. Without it, anyone with push access can push directly. Critical for any non-personal posture. **Parameter recommendations are posture-aware:**
  - **Multi-person teams**:
    - `required_approving_review_count: 1` (or higher for sensitive repos)
    - `require_code_owner_review: true` (paired with a CODEOWNERS file)
    - `require_last_push_approval: true` (closes the "approve, then push more" gap)
    - `dismiss_stale_reviews_on_push: true`
    - `required_review_thread_resolution: true`
    - `allowed_merge_methods: ["squash"]` (clean history; mandatory for changelog-from-PR-title repos)
  - **Solo-maintainer repos** — apply the same `pull_request` rule but with the approval gates dropped (GitHub blocks self-approval; any positive `required_approving_review_count` deadlocks the maintainer on their own PRs):
    - `required_approving_review_count: 0`
    - `require_code_owner_review: false`
    - `require_last_push_approval: false`
    - `required_review_thread_resolution: false` (or `true` if you want to enforce resolving Copilot comments before merge)
    - `allowed_merge_methods: ["squash"]`
    - The rule still enforces "must go through a PR" (no direct push to main) and restricts merge methods. `required_status_checks` still gates merges on CI passing. Only the approval *gate* is removed.
- **Required status checks.** `required_status_checks` rule. Pull the actual context names from the most recent successful PR and check they're listed. Generic "CI" is not enough — name the specific contexts. `strict_required_status_checks_policy: true` requires the branch to be up to date before merging (good practice, adds friction).
- **Linear history.** `required_linear_history` rule (or implicit via squash-only merge method). Recommended.
- **Force-push protection.** `non_fast_forward` rule. Almost always wanted on the default branch.
- **Deletion protection.** `deletion` rule. Always wanted.
- **CODEOWNERS-gated review.** Combine `require_code_owner_review: true` with a CODEOWNERS file covering at least `.github/` and security-sensitive paths.
- **Apply-to-administrators / no exemption.** For rulesets: `bypass_actors: []` (no bypass) or only the release bot. For classic branch protection: `enforce_admins.enabled = true`. Without this, admins silently sidestep every rule.
- **Bypass actors for the release bot — `github-actions[bot]` cannot be one.** If a release workflow pushes to the default branch directly (a "finalise changelog" commit) or force-updates a floating tag (`v1`), it needs to bypass the relevant rules. `github-actions[bot]` is **not a valid bypass actor** — neither in the UI's bypass picker nor via the REST API (the API rejects `actor_type: Integration, actor_id: 15368` with "must be part of the ruleset source or owner organization"). Real options: (a) restructure the release flow to PR the finalise commit instead of direct-pushing; (b) install a custom GitHub App, add it to `bypass_actors`, and mint its token via `actions/create-github-app-token` in the workflow; (c) use a PAT under a service-account user. Flag any ruleset rule that the release bot needs to bypass as a **WORKFLOW REDESIGN** finding rather than a config-level fix — it cannot be solved with a single `gh api` call. (GitHub's ruleset bypass-actor support has shifted over time — re-verify against current docs before relying on this.)

  **Pragmatic alternative for solo / small-team repos not running a custom GitHub App: drop the rules the bot can't satisfy.** The release-PR-and-merge step the maintainer already performs *is* the gate; the ruleset shouldn't enforce a second gate on the same commit when the only thing pushing to main is a bot with no way to satisfy it. The minimum-viable default-branch ruleset for this case is `deletion` + `non_fast_forward` (+ `copilot_code_review` informationally). On `refs/tags/v*`: `deletion` + `non_fast_forward` (the latter still permits fast-forward updates of floating-major tags).

## Tag protection / rulesets

For repos that publish reusable workflows or actions consumed via floating `@vN` tags, this is the highest-impact category. Floating-tag fanout is *faster* than main-branch compromise because no review-PR-and-merge dance is required to push a malicious tag.

- **Ruleset target `tag` covering `refs/tags/v*`** (or whichever pattern the repo uses for distribution tags).
- **Deletion blocked.** `deletion` rule. Always wanted — accidental tag deletion breaks every consumer.
- **Update blocked.** `update` rule. Blocks force-update of an existing tag. ⚠️ `github-actions[bot]` can't bypass this either (not a valid bypass actor — API or UI); WORKFLOW REDESIGN, same trap as above.
- **No bypass for tags except the release bot.** Specifically *do not* recommend `OrganizationAdmin` bypass on tag rulesets if a colleague-admin could update them by mistake. This caution applies to org-owned repos only — `OrganizationAdmin` is an org-owned-repo concept and isn't a selectable actor on personal repos.

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

## Section D — Workflow redesign required

Findings that cannot be applied with a `gh api` call alone. Most commonly: the release bot needs to bypass a ruleset rule, but `github-actions[bot]` is not a valid bypass actor — neither in the UI's bypass picker nor via the REST API. For each finding here, propose the redesign path explicitly: restructure the release flow to PR the change, install a custom GitHub App, or use a PAT. Do not describe a UI walkthrough for the github-actions case — there isn't one.

## Section E — Summary

- Top 3 quick wins (where "win" weights *security* × *implementation cost* × *posture-alignment*).
- The single most important security finding, posture-tagged.
- Distribution-tag fanout — present or absent? If present, name the tag and the consumers affected.
- Open questions for the user that block further hardening.

# PHASE 4 — IMPLEMENTATION

After presenting the report, ASK whether to proceed with Section A changes. If approved, apply them with the bash block from Section A. After each step, verify by re-reading the corresponding `gh api` endpoint and confirm the value flipped.

Do nothing from Sections B, C, or D without an explicit new request.

For Section D items, output a concrete redesign sketch (e.g., "Install a `release-bot` GitHub App in the org, scope: contents:write + pull-requests:write; mint its token in cut-release.yml via `actions/create-github-app-token`; add the App to `bypass_actors` on the main ruleset"). Do not describe a UI walkthrough for `github-actions[bot]` bypass — the option does not exist in the picker.

# CONSTRAINTS

- Do not modify any setting before Section A is approved.
- Never disable a rule that protects the default branch or a release tag without an explicit replacement.
- Do not delete or downgrade collaborator roles without confirming with the user.
- Do not assume a setting just because the web UI shows it — query the API.
- Quote the exact `gh api` endpoint and JSON field for every finding.
- When recommending bypass actors, default to `bypass_mode: "always"` for release bots (custom GitHub App / PAT identities — not `github-actions[bot]`) and `bypass_mode: "pull_request"` only when the bypass is for merge-without-review (not direct push). `bypass_mode: "pull_request"` applies to BRANCH rulesets only — on TAG rulesets use `bypass_mode: "always"` (`pull_request` bypass_mode is not valid on tag rulesets).
- `github-actions[bot]` is **not a valid bypass actor** for rulesets (neither API nor UI). Do NOT try `actor_type: Integration, actor_id: 15368` — it fails with "must be part of the ruleset source or owner organization". Do NOT recommend a UI walkthrough for it either — the option isn't there. Mark findings that require this bypass as **WORKFLOW REDESIGN** and propose a custom App, a PAT, or restructuring the release flow.
- For solo-maintainer postures, do NOT recommend `required_approving_review_count: ≥1` or `require_code_owner_review: true` on the default branch — GitHub's product blocks self-approval, so the rule deadlocks the maintainer's own PRs. The `pull_request` rule is still useful (forces PRs, restricts merge methods), just with the approval gates disabled.
- Always check both classic branch protection AND rulesets. Never declare "unprotected" based on one endpoint.
- Always check both default-branch AND tag protection. For distribution repos pinned via floating tags, tag protection is the higher-impact category.
