# Return contracts

Summarisation is lossy and the loss is silent. A subagent that drops the one
stack frame that mattered returns something that reads perfectly complete. These
contracts exist to make omission visible.

Every delegated return must obey four rules:

1. **Evidence and interpretation are separate blocks.** A diagnosis never
   arrives dressed as an observation.
2. **Every claim carries a pointer back to raw** — `file:line`, test name, job
   URL, comment permalink. The caller must be able to pull the original when a
   summary smells wrong.
3. **Silence is affirmative.** An explicit "nothing else notable" field, so the
   caller can distinguish "clean" from "didn't look".
4. **Truncation is declared.** If the source was larger than what was read, say
   so and say by roughly how much.

## Verifier

```
COMMANDS RUN
  <command> → exit <code>

EVIDENCE
  - <failing test name> — <file:line> — <one-line failure message>

CLUSTERS
  - <root cause>: <n> failures, tests <names>

INTERPRETATION
  - likely cause: <...>
  - confidence: high | medium | low

FLAKY SUSPECTS
  - <test> — passed on rerun <n>/<m>

NOTHING ELSE NOTABLE: yes | no — <if no, what>
TRUNCATED: no | yes — read <x> of ~<y> lines
```

## Recon

```
QUESTION ASKED
  <the question, restated>

FINDINGS
  - <fact> — <file:line>

CALL PATH (if traced)
  <a:12> → <b:88> → <c:140>

NOT FOUND
  - <what was searched for and where, that didn't turn up>

INTERPRETATION
  <kept short, and clearly marked as inference>

NOTHING ELSE NOTABLE: yes | no
TRUNCATED: no | yes — <scope not covered>
```

`NOT FOUND` is load-bearing. An absent result and an unsearched area look
identical in a summary unless one is stated.

## Review gatherer

```
THREADS BY FILE
  <path>
    - [unresolved] <reviewer>: <compressed point> — <permalink>
    - [author-replied] <reviewer>: <compressed point> — <permalink>
    - [resolved] <reviewer>: <compressed point> — <permalink>

DUPLICATES MERGED
  - <point> raised by <n> reviewers

BLOCKING vs OPTIONAL
  blocking: <list>
  optional: <list>

NOTHING ELSE NOTABLE: yes | no
TRUNCATED: no | yes — <n> of <m> threads read
```

Thread status is what makes the brief actionable rather than something the
caller has to re-verify — and re-verification hands the context savings straight
back.
