# Appendix — Writing

*Practice appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers every sentence an engineer or an agent writes for another reader: chat replies, pull requests, commit bodies, documentation, code comments, plans, handoffs, and explanations. The standard says what good code is. This appendix says what good prose is.*

---

## 1. Scope

The rules apply to:

- Agent replies in Claude Code, Copilot Chat, Claude.ai, and any other assistant working in a Sigma repo.
- PR titles and bodies, commit bodies, and review comments.
- READMEs, everything under `docs/`, runbooks, ADRs, plans, handoff notes, and backlogs.
- Code comments and docstrings.
- Explanations and reports, in chat or in a file.

The rules do not apply to quoted source material, verbatim error text, product copy governed by a design system, or legal text.

## 2. The Posture

Write for density. Every sentence carries a fact, a cause, or an instruction. Nothing carries only tone.

An earlier version of this guide banned words. New words like them kept appearing, because the problem generates new instances. These rules ban the categories instead. When output breaks a rule, the fix is not a shorter synonym. The fix is the literal statement underneath.

## 3. The Rules

1. **One term per concept.** Pick a word, reuse it. Never vary for style: a "renderer" is never later a "rendering layer" or "display engine". Same concept, same word, every time, in prose and in code.

2. **Literal only. No metaphor, no idiom.** Cut "load-bearing", "seams", "surface area", "north star", "move the needle", "under the hood". State the mechanism: not "this call is load-bearing" but "remove this call and X breaks".

3. **One idea per sentence.** This kills "not just X but Y", "not only… but also", "less about X, more about Y". If only Y is true, write Y. If both are true, write two sentences.

4. **Active voice.** Name the agent. "The migration updates the schema", not "the schema is updated".

5. **Imperative for instructions.** "Run the seed script." Not "you'll want to run it" or "the script should be run". One instruction per sentence.

6. **Simple tenses.** Present, past, future. Avoid -ing openers: "Use X, then do Y", not "Using X, do Y".

7. **Cap length.** About 20 words for an instruction, 25 for description. A longer sentence is usually two ideas or a hedge. Split it.

8. **Break noun stacks at three.** "Offline-first Godot state-sync layer" is the ceiling. Past it, unpack into a clause. A few more words read faster.

## 4. Code and Docs

- **Comments** state cause and effect, literally. "Guards against double-submit on retry", not "handles the edge case here".
- **Docstrings** state invariants, side effects, and failure modes: what the signature does not show. Do not restate parameter names and types.
- **PR body** states what changed and why the diff is not obvious. Under about 120 words. Omit empty sections.
- **Commit subject** states what changed, imperative mood, no trailing period. Body only when the why is not visible in the diff. Format per the [Version Control appendix](./appendix-version-control.md).
- **READMEs** give imperative steps, one per line. No preamble.
- **Plans and handoffs** carry a status line with a date. A shipped item says "shipped" and names the PR. An open item names the trigger or the blocker.

## 5. The One Exception

This is not compression. Clarity outranks word count. Keep articles: "the", "a". Add the word that removes ambiguity. Density is the goal, not brevity. Terse and wrong is worse than plain and complete.

## 6. Banned Phrases and Patterns

The rules ban categories. This list is the fast check for a one-off prompt, a review pass, or a Claude.ai custom style. A catch is either a word on this list or a category violation from §3. The word is the symptom; the category is the fix. Log the word, then note the category it came from.

**Metaphor / idiom (rule 2).** load-bearing, seams, surface area, north star, move the needle, in the weeds, first-class citizen, under the hood, heavy lifting, table stakes, low-hanging fruit, sharp edges, paper over, lift and shift, bread and butter.

**Antithesis scaffolding (rule 3).** "not just X but Y" · "not only… but also" · "it's less about X and more about Y" · "X isn't just Y — it's Z" · "think of it less as X and more as Y".

**Inflated / vague.** leverage, robust, seamless, delve, comprehensive, furthermore, moreover, utilize, facilitate, streamline, holistic, synergy, pivotal, intricate, realm, tapestry, testament to, navigate (metaphorical), landscape (metaphorical).

**Throat-clearing.** "it's important to note" · "it's worth mentioning" · "let's dive in" · "great question" · "I hope this helps" · "at the end of the day" · "in today's X world".

**Structural tells.**

- Exactly three items, regardless of how many the point needs.
- A closing paragraph that restates the body.
- An opening that rephrases the question.
- Uniform sentence length across a paragraph.
- Bullets for what is really one sentence.
- Bolded phrases and "This section covers…" preambles in documentation.

**Keeping the list current.** Each repo that runs a style audit keeps a catch log in its audit report: the phrase, the file, and the category. When new entries slow, the categories are holding. Promote a recurring catch to this list by PR.

## 7. Installing the Style

The style ships three ways from the [engineering-playbook](https://github.com/sigmadigitalza/engineering-playbook) repo, all generated from one source (`docs/prompts/writing-style.md`):

- **Claude Code output style `sigma-terse`.** Installs with the `sigma-engineering` plugin. Select it in `/config` → Output style, or pin it for a repo with `"outputStyle": "sigma-terse"` in `.claude/settings.json`. An output style applies to the main session only. Subagents read the repo's `AGENTS.md`, so add the pointer in §8 there too.
- **The `writing-style` skill.** Installs with the same plugin. It fires when an agent writes or reviews prose, and it carries the review procedure.
- **Copilot instructions.** `.github/instructions/writing-style.instructions.md` with `applyTo: "**"`, so Copilot Chat, code review, and the coding agent read it for every file. Copy it into the repo like the other review instructions.

For Claude.ai, paste §3 to §6 into a custom style.

## 8. Repo Pointer

Add this to a Sigma repo's `AGENTS.md` (or `CLAUDE.md`), under its conventions:

```markdown
- **Writing.** Prose follows the Sigma
  [Writing appendix](https://github.com/sigmadigitalza/engineering-playbook/blob/main/docs/standards/appendix-writing.md):
  literal, active, one idea per sentence, one term per concept. Applies to
  replies, PR bodies, commits, docs, comments, plans and handoffs.
```

## 9. The Checklist (PR-time)

- [ ] PR body states what changed and why the diff is not obvious, under about 120 words
- [ ] No phrase from §6 in the diff, the PR body, or the commit messages
- [ ] One term per concept across the diff, in prose and in identifiers
- [ ] Comments state cause and effect; docstrings state what the signature does not show
- [ ] Instructions are imperative; sentences sit under the length cap
- [ ] Any plan or handoff touched carries a dated status line

---

## References

- [Google developer documentation style guide](https://developers.google.com/style) — active voice, present tense, second person.
- [George Orwell — Politics and the English Language](https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/) — the source of the metaphor rule.
- [Version Control appendix](./appendix-version-control.md) — commit and PR format.
- [Documentation review playbook](../playbooks/documentation-review.md) — the accuracy and structure audit this style pairs with.

---

*Sigma Writing Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
