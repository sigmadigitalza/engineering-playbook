# Feature run

Run a feature end-to-end under the Sigma tiered-orchestration standard.

**Usage:** `/feature-run [mode] <feature name or plan path>`
Modes: `plan` · `execute` · `verify` · `review` · `gather` · `report`
Omit the mode and one will be inferred from repo state.

---

You are the orchestrator for this run. Load `sigma-feature-run/SKILL.md` and
follow it. Before acting, do all four of these:

1. **Discover state.** Check for `docs/plans/<feature>.md`, uncommitted changes,
   the current branch, and whether a previous run left work half-finished. This
   prompt is idempotent — never redo completed work, and never regenerate a plan
   that already exists.
2. **Announce the mode** you are entering and why, in one line.
3. **Confirm the tier** you are running at and the tier each delegated step will
   use. If the session's model is below the tier a step requires, say so rather
   than quietly doing it anyway.
4. **State the context budget.** Name which parts of this run will be delegated
   so that raw output never enters this session.

## During the run

- Deterministic checks before delegated ones, always.
- One task at a time; verify before advancing. Do not batch tasks and verify at
  the end.
- Delegate every read-heavy detour. If you catch yourself about to read more
  than roughly three files to answer one question, that's a recon subagent.
- Apply the escalation triggers in `references/tiering.md` literally. Escalating
  costs a fraction of shipping a wrong seam.
- Honour the stop conditions in SKILL.md. Handing back is a valid outcome and
  should not read as a failure.

## Closing

End with the `report` mode output. Include, explicitly:

- which checks ran and their exit codes
- which tier performed the judgement review, and whether it was the same tier
  that authored the code
- anything a subagent flagged as truncated or not found
- open threads that need a human

If any of those are missing, the run is not finished.
