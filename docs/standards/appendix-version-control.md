# Appendix — Version Control

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers Git and the collaboration standards around it — commits, branches, pull requests, releases, and repo hygiene. This is developer best practice first — how a Sigma engineer works with version control by hand. It is also the bar for any AI agent committing in our repos: match these conventions, and surface any deviation (see [§8 of the standard, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

## 1. Commits

- **Conventional Commits.** Every message is `type(scope): summary` — `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `style`. The type drives the changelog and the release version; it isn't decoration.
- **Imperative summary, ≤ 72 chars.** "add retry to the client", not "added" or "adds". A body explains *why* when the diff doesn't.
- **One logical change per commit.** A commit should be revertible on its own. Don't bundle a refactor with a fix.
- **Breaking changes are marked** — a `!` after the type (`feat!:`) or a `BREAKING CHANGE:` footer. That, and only that, bumps the major version.

## 2. Branches & Pull Requests

- **Short-lived branches off `main`.** Branch, do one thing, open a PR, merge, delete. Days, not weeks — long branches rot and conflict.
- **Small, focused PRs.** A reviewable PR is a few hundred lines on one concern. Bigger is usually two PRs; stacked PRs beat one giant one.
- **`main` is always releasable.** It's protected — PR + green CI + review to merge, no direct pushes. Prefer feature flags over long-lived feature branches.
- **The PR description is the spec.** What changed, why, how it was verified, what a reviewer should look at. Link the issue, and self-review the diff before requesting review.
- **Squash-merge by default**, so `main` reads as one clean commit per change. The PR title is the Conventional Commit that becomes the squash message.

## 3. Changelog & Releases

- **Keep a Changelog** — a human-readable `CHANGELOG.md`, newest first, grouped *Added / Changed / Fixed / Removed*. Written for the reader, not the machine.
- **Semantic Versioning** — `MAJOR.MINOR.PATCH`. `feat` → minor, `fix` → patch, breaking → major. The Conventional Commit types make this mechanical.
- **Automate the bookkeeping.** The version bump and changelog entries are generated from the merged commits; humans curate the prose, not the arithmetic. (See the [CI/CD appendix](./appendix-ci-cd.md).)
- **Tag every release.** An annotated, signed `vX.Y.Z` tag is the source of truth — releases hang off tags, not branches.

## 4. Repo Hygiene

- **`.gitignore` from commit one** — build output, dependencies, `.env`, editor and OS cruft. Committing them once is hard to fully undo later.
- **No secrets, ever.** Tokens, keys, and `.env` files stay out of history. If one lands, *rotate it* — `git rm` doesn't un-leak it. Secret scanning is on (see the repo-setup playbook).
- **No large binaries in Git.** Use Git LFS or external storage; a bloated history is permanent and slow to clone.
- **A real `README`** (what it is, why, how to run) and a `CODEOWNERS` so reviews route to the right people.
- **Legible history.** Rebase your *own* branch to tidy it before review; never rewrite shared or `main` history.

## 5. Tooling

- **The command line is the source of truth.** Know `git` itself — `add -p`, `rebase -i`, `bisect`, `reflog`, `restore`. GUIs are conveniences on top, not a substitute for understanding what they do.
- **lazygit** is the team-default terminal UI — fast staging, interactive rebase, and hunk-level commits without leaving the shell.
- **GitHub CLI (`gh`)** for PRs, reviews, and checks from the terminal — `gh pr create`, `gh pr checks`, `gh pr merge`.
- **Pre-commit and commit-msg hooks** enforce the Conventional Commit format and run formatters/linters locally, so CI isn't the first place a problem surfaces.

## 6. The Checklist (PR-time)

- [ ] Branch is short-lived and off the latest `main`
- [ ] PR is small and single-concern; the title is a valid Conventional Commit
- [ ] Description covers what, why, and how it was verified
- [ ] No secrets, generated files, or large binaries in the diff
- [ ] CHANGELOG updated (or generated) for user-facing changes
- [ ] Green CI; self-reviewed before requesting review

---

## References

- [Conventional Commits](https://www.conventionalcommits.org/).
- [Keep a Changelog](https://keepachangelog.com/).
- [Semantic Versioning](https://semver.org/).
- [Pro Git](https://git-scm.com/book) — the book, free online.
- [GitHub CLI](https://cli.github.com/) · [lazygit](https://github.com/jesseduffield/lazygit).

---

*Sigma Version Control Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
