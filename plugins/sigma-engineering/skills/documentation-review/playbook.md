# Documentation Review & Scaffolding Playbook

A strategy and Claude Code prompt for auditing repository documentation for clarity, accuracy, structure, and agent-readability — while respecting the existing author voice and scaffolding missing foundational files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `docs/`) where absent.

---

## Strategy

**Respect-first posture.** This is the biggest shift from a typical code-review playbook. Documentation is mostly judgment, and the author's voice carries information — tone tells a junior dev whether it's okay to ask stupid questions, tells a senior dev whether the project takes itself seriously. A prompt that rewrites everything into neutral technical-writer voice will feel sanitized and worse, even if it scores higher on some rubric. So the prompt needs to force Claude Code to sample the existing voice before editing and preserve it.

**Recon before any editing.** Without it, Claude Code tends to "improve" the first README it sees, miss that there's a perfectly good `docs/architecture.md` already covering the topic, and generate duplication. Recon should also catch the opposite failure mode: a repo where the README looks fine but `docs/` is full of stale content from two refactors ago.

**Agent-readable ≈ human-readable.** Mostly. The same things that make docs good for junior devs (clear hierarchy, explicit structure, runnable examples, a "start here" path) make them good for agents. A few places diverge: agents benefit from explicit file-path references (`src/foo.ts` not "the foo module") and from front-loaded TL;DRs; humans tolerate narrative intros better. The prompt should nudge toward explicit over implicit without sacrificing readability.

**Agent instructions are scaffolding, not docs.** `CLAUDE.md`, `AGENTS.md`, and `.github/copilot-instructions.md` should point to the docs, not duplicate them. Their job is: how is this repo laid out, what commands matter, what conventions to follow, what *not* to touch. If they restate what `README.md` says, they go stale in opposite directions. The prompt should enforce this.

**Scaffolding is additive.** Creating a missing `CLAUDE.md` or a `docs/` skeleton when absent is genuinely safe — it doesn't modify anything existing. Put this in Section A (same bucket as typo fixes) with a clear "only if absent" guard, rather than making the user wait through Section B for files that should obviously exist.

**Diátaxis as optional scaffolding, not dogma.** The [Diátaxis](https://diataxis.fr/) framework (tutorials / how-to / reference / explanation) is a good default when there's no existing structure to respect. But if the repo already has a coherent `docs/` layout — even one that doesn't match Diátaxis — the prompt should work with that rather than propose a rewrite. Diátaxis goes in Section B, not A.

**Three buckets, same shape as the GH Actions playbook:**

- **A — Safe corrections & scaffolding.** Typos, broken links, code-fence language tags, factual errors contradicted by the code itself, and *creation of missing* foundational files (README sections, `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, empty `docs/` skeleton). Nothing existing gets restructured here.
- **B — Judgment calls.** Restructuring existing docs, adopting Diátaxis, merging/splitting pages, rewriting for clarity, new conceptual docs, terminology unification.
- **C — Critical findings.** Credentials or internal hostnames in examples, dangerous instructions (`rm -rf` without guardrails), inaccurate security guidance, license inconsistencies, references to private infra that shouldn't be public.

**One specific trap to encode.** AI-generated documentation has a tell — heavy bolded phrases, marketing adjectives ("robust," "seamless," "powerful"), excessive emoji, and "This section covers..." preambles. The prompt should explicitly forbid adding these when editing or creating docs, because Claude Code under-instructed will sprinkle them everywhere and it'll read as obviously AI-touched.

---

## The Prompt

Paste into Claude Code, run from the repo root.

````markdown
You are a senior technical writer and developer-experience engineer. You are reviewing a repository's documentation for clarity, accuracy, structure, and agent-readability. Assume the audience is developers from junior to senior, and that AI coding agents (Claude Code, GitHub Copilot, Cursor) will also consume these docs.

Your prime directive: **respect the existing documentation and author voice**. Work with what is there. Do not replace idiosyncratic-but-working docs with generic templates. Do not sanitize tone.

# SCOPE

Review all human-facing documentation and agent-configuration files:
- `README.md` at root and any per-package READMEs
- Everything under `docs/` if present
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `CHANGELOG.md`
- `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursorrules`
- `.github/PULL_REQUEST_TEMPLATE.md`, issue templates
- Architecture Decision Records (ADRs) typically under `docs/adr/` or `docs/decisions/`
- Inline documentation in entry-point files (main package README-equivalents) — not general code comments

Cross-check documentation against the actual code where feasible: do `package.json` scripts match what the README says? Do referenced files exist? Do code examples match current APIs?

# PHASE 1 — RECONNAISSANCE

Do this first. Report briefly before any analysis.

1. **Inventory.** List every documentation file found with one-line purpose and approximate freshness (git log last-modified if you can determine it, otherwise note).
2. **Voice sample.** Read at least three representative documentation files and characterize the author voice in 2–3 sentences: formality (formal / conversational / casual), person (first / second / third), use of humor, emoji conventions, typical sentence length, any recurring stylistic signatures. Quote two short example sentences. This voice profile governs every edit you propose.
3. **Structural map.** Describe the current `docs/` layout if present. Identify whether it already follows a recognizable framework (Diátaxis, Divio, monorepo-per-package, flat) or is ad-hoc.
4. **Agent files.** Note which of `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` exist. Read each and note whether they point to docs or duplicate them.
5. **Stack detection.** Languages, build tools, package managers. This determines what "getting started" must cover.
6. **Gaps.** List foundational files that are absent (e.g., no `CONTRIBUTING.md`, no `LICENSE`, no `docs/` folder at all).

# PHASE 2 — REVIEW RUBRIC

For each finding, record: file path, location (section heading or line range), severity (Critical / High / Medium / Low / Nit), and one of:
- **SAFE** — corrections to existing content, or net-new scaffolding files where absent, that do not restructure existing docs
- **JUDGMENT** — restructuring, rewriting, new conceptual content, or framework adoption
- **CRITICAL** — security, licensing, accuracy, or dangerous-guidance finding

## Clarity & Approachability

- **Start-here path.** Can a new developer go from "I just cloned this" to "it's running locally" without getting stuck? Flag missing or broken onboarding.
- **Audience signposting.** Are sections labeled for their audience (e.g., "If you're contributing a new game," "If you're deploying to production")?
- **Jargon introduced before it's defined.** Especially domain-specific terms.
- **Implicit context.** Docs that assume knowledge of a predecessor system, a private conversation, or tribal knowledge.
- **Tone-audience fit.** Overly casual for security docs; overly formal for contributor guides. But defer to established voice unless it actively harms comprehension.

## Accuracy

- **Code vs docs drift.** Commands, flags, file paths, env var names, config keys that don't match the current code.
- **Broken internal links.** Relative links to moved/renamed files.
- **Broken external links.** Best-effort — note as a check to run, don't block on them.
- **Stale version references.** "Requires Node 16" when `package.json` says `>=20`.
- **Contradictions between docs.** README says one thing, `docs/setup.md` says another.

## Structure & Navigation

- **README shape.** Does it answer in the first screen: what is this, who is it for, how do I run it, where do I go next? Not a checklist — a smell test.
- **`docs/` index.** Is there a `docs/README.md` or `docs/index.md` that orients readers? Or does `docs/` dump 20 files into a flat folder with no nav?
- **Heading hierarchy.** Semantic `##` / `###` nesting, not bolded text pretending to be headings. This matters for agents parsing structure.
- **Diátaxis fitness** (judgment only). If structure is ad-hoc and the repo would benefit, suggest a Diátaxis layout (tutorials / how-to / reference / explanation) in Section B. If existing structure is coherent but different, leave it alone.
- **Cross-linking.** Related pages that should reference each other but don't.

## Formatting & Conventions

- **Code fences.** Language tags present (```` ```bash ```` not ```` ``` ````)? Agents and syntax highlighters need them.
- **Consistent terminology.** "The client" vs "the frontend" vs "the web app" used interchangeably for the same thing.
- **Consistent casing.** `GitHub` not `Github`, `npm` not `NPM` or `Npm`, project name spelled/cased consistently throughout.
- **List vs prose balance.** Walls of bullet points where prose would read better; dense prose where a list would scan better.
- **Callouts.** Notes, warnings, and tips formatted consistently if the repo uses them.

## Agent-Readability

- **Explicit file paths.** "See `src/adapters/storage.ts`" beats "see the storage adapter." Agents resolve paths; humans benefit too.
- **Runnable examples.** Complete enough to copy-paste, with working directory noted when it matters.
- **TL;DR at top of long docs.** Agents and skimmers both benefit from a lead summary.
- **Avoid implicit ordering.** "As mentioned above" / "see earlier" — be specific about what and where.

## Agent Instruction Files

- **Presence.** At minimum one of `CLAUDE.md` / `AGENTS.md` should exist for agent-heavy workflows. `.github/copilot-instructions.md` if Copilot is in use.
- **Role clarity.** These files should cover: project overview (one paragraph), repo layout with key directories, common commands (build, test, run, lint), conventions the agent should follow, files/areas to leave alone, where to find more context.
- **Non-duplication.** They should reference `README.md` and `docs/` rather than restating them. Restated content goes stale.
- **Concision.** These files consume context tokens on every agent invocation. Tight is better than comprehensive.
- **Absence.** If missing, scaffolding them from existing repo content is a Section A action.

## Governance & Legal

- **`LICENSE` present and declared in README.**
- **`SECURITY.md` present** with a disclosure channel if the project is public or handles user data.
- **`CONTRIBUTING.md` present** if external contributions are expected, with at minimum: local dev setup, how to propose changes, testing expectations.
- **`CODEOWNERS`** alignment with team reality if present.
- **`CHANGELOG.md`** — if present, is it current? If absent and the project is versioned, flag.

## Critical Findings (Section C territory)

- **Credentials or secrets** in examples, even if "example" or "redacted" — API keys, tokens, real connection strings.
- **Internal hostnames, IPs, or staging URLs** in public docs.
- **Real customer/user names or data** in examples.
- **Dangerous commands** without guardrails (`rm -rf`, destructive migrations, `--force` pushes).
- **Inaccurate security guidance** — "just disable SSL for local dev" without context, example code that demonstrates an anti-pattern being taught as the pattern.
- **License conflicts** — e.g., GPL code vendored into an MIT project without notice.
- **References to private infrastructure** that shouldn't be in a public repo.

# PHASE 3 — REPORT

## Section A — Safe Corrections & Scaffolding

Numbered list. Two sub-buckets:

### A1. Corrections to existing docs
For each: file, location, before/after snippet, one-line rationale. Typos, broken links, wrong commands, code-fence language tags, consistent casing of project/tool names, obvious factual errors checked against code.

### A2. Scaffolding (net-new files only where absent)
Propose file contents for:
- `CLAUDE.md` — if absent. Concise. Points to `README.md` and `docs/`. Covers layout, commands, conventions, leave-alone areas.
- `AGENTS.md` — if absent and CLAUDE.md is absent, or cover both if team uses multiple agent tools.
- `.github/copilot-instructions.md` — if absent and Copilot is used (check for Copilot-related CI or team indicators).
- `docs/README.md` index — if `docs/` exists but has no index.
- `docs/` skeleton with placeholder stubs — only if no `docs/` folder exists at all.
- `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` reference in README — if missing.

For each scaffolding file: full proposed contents, with a note on what was pulled from existing repo content vs what's placeholder.

These are the ONLY changes you may offer to apply automatically.

## Section B — Structural & Content Improvements

Judgment calls. Group by theme (e.g., "Restructure `docs/` to Diátaxis," "Unify terminology around the rendering pipeline," "Rewrite the deploy guide for accuracy"). For each: current state, proposed change, effort estimate, what the author should weigh in on.

At the end, produce a ready-to-paste follow-up prompt to implement a chosen subset.

## Section C — Critical Findings

Ordered by severity. For each: file + location, description, concrete risk, recommended fix.

At the end, produce a ready-to-paste follow-up prompt to address these findings.

## Section D — Summary

- Top 3 quick wins
- Biggest structural opportunity
- Single most important critical finding, if any
- Voice-profile summary (one paragraph) — so it's visible which voice you'll preserve in edits

# PHASE 4 — IMPLEMENTATION

After presenting the report, ASK whether to proceed with Section A. If approved, apply all A1 corrections and A2 scaffolding as a single coherent set of edits, then output:
- A suggested commit message (conventional-commits style, e.g. `docs: fix broken links, normalize project casing, scaffold agent instructions`)
- A suggested PR description

Do nothing from Section B or C without an explicit new request.

# CONSTRAINTS

- Do not modify any existing file before I approve Section A.
- Preserve the author voice sampled in Phase 1. When editing, match sentence rhythm, formality level, and stylistic signatures. When in doubt, change less.
- Do not introduce AI-boilerplate: avoid "robust," "seamless," "powerful," "leverages," "utilize," bolded phrase-soup, excessive emoji, or "This section covers..." preambles — unless the existing docs already use them.
- Do not restructure existing `docs/` layouts as a Section A action. Restructuring is Section B.
- Do not fabricate facts about the project. If something is unclear, flag it as a question for the author rather than inventing an answer.
- Agent instruction files must reference existing docs, not duplicate them.
- Do not add content whose accuracy you cannot verify against the code or existing docs.
- If a doc has an idiosyncratic voice that is clearly deliberate, preserve it even if it's unconventional.
````

---

## Notes on Using It

- For repos with substantial existing architecture documentation, Section A will mostly be drift fixes (commands, paths, version numbers) and agent-instruction scaffolding. Section B is where the real value lands — unifying terminology across docs, and deciding whether the existing structure should be formalized.
- The voice-sample step is the thing to check if outputs feel off. If Phase 1's voice characterization doesn't match how your docs actually read, the edits downstream will miss too. Push back on a bad voice profile before accepting anything in Section A.
- Worth running this once per repo rather than making it a recurring check — after one pass, Section A should be near-empty on re-runs, and Section B/C become the ongoing value.

---

## Reference Material

- [Diátaxis — a systematic framework for technical documentation](https://diataxis.fr/)
- [Write the Docs — topic guides](https://www.writethedocs.org/guide/)
- [GitHub — Adding a README for agents (AGENTS.md pattern)](https://agents.md/)
