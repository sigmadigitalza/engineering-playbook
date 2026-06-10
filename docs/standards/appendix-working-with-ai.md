# Appendix — Working With AI

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers using AI coding agents — Claude, GitHub Copilot, and the like — responsibly, and how to ground one in this handbook before it writes a line. AI is a force multiplier held to the same bar as everyone else: the standards apply to its output exactly as they apply to ours (see [§8 of the standard, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

## 1. The Posture

- **You own the output.** An agent drafts; an engineer is accountable. Review everything it produces as if you wrote it — because, for the purposes of the PR, you did.
- **Same standards, no exceptions.** AI-written code meets the Sigma Ten, the appendices, and the security baseline like any other. "The AI did it" is never an explanation in review.
- **Verify, don't trust.** Run it, read it, test it. Agents are confidently wrong sometimes — confirm behaviour and watch for hallucinated APIs, subtle errors, and silent scope creep.
- **Small, reviewable changes.** Keep agent-assisted work to focused PRs a human can actually review. A 2,000-line AI diff is a liability, not productivity.

## 2. Responsible Use

- **Never paste secrets or customer data** into a prompt — tokens, keys, PII, proprietary third-party code. Treat the context window as if it could be logged.
- **Keep humans in the loop** for decisions with real consequences: security, data, money, anything irreversible.
- **Let the agent surface its reasoning.** Ask it to cite the standard it's following, flag where it's unsure, and call out deviations rather than paper over them.
- **The tools.** [Claude Code](https://claude.com/claude-code) installs this handbook as a plugin; [GitHub Copilot](https://github.com/features/copilot) reads the same guidance from `.github/instructions/`. Both auto-activate the right review skill by task — install and update steps are in the repo [README](https://github.com/sigmadigitalza/engineering-playbook#use-in-your-ai-assistant).

## 3. Grounding an Agent

For a fresh session — or any agent that doesn't already have our plugin — paste this to map the handbook before work starts:

```text
You are working in a Sigma Digital repository. Ground yourself in our engineering
handbook before writing code:

- Engineering standards — https://sigmadigital.io/engineering-playbook/docs/standards/
  The Sigma Ten, the security / resilience / supply-chain baselines, maturity tiers,
  the AI Agent Rules of Engagement (§8), and the per-stack appendices (your language,
  plus version control, CI/CD, and accessibility). Follow the appendix for the stack
  you are in.
- Design baselines — https://sigmadigital.io/engineering-playbook/docs/design/
  The visual and interaction foundations any UI work follows.
- Review playbooks & skills — https://sigmadigital.io/engineering-playbook/docs/playbooks/
  Code review, security, accessibility, API design, database, CI/CD, SRE, and more.

Hold yourself to these as a Sigma engineer would. Where a change would deviate, say so
and why rather than working around it silently; cite the specific rule when a decision
is non-obvious; and ask when scope or a trade-off is unclear.
```

Trim the list to what's relevant — a backend task doesn't need the design baselines; a UI task does.

## 4. The Checklist (PR-time)

- [ ] Every line reviewed and understood, not just accepted
- [ ] Behaviour verified — run, read, tested — not assumed
- [ ] No secrets, customer data, or proprietary code went into a prompt
- [ ] Change is small and focused enough for a human to review
- [ ] Meets the same standards as hand-written code; deviations are called out

---

## References

- [Claude Code](https://claude.com/claude-code) · [GitHub Copilot](https://github.com/features/copilot).
- [§8 — AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement).
- [The engineering handbook](https://sigmadigital.io/engineering-playbook/) — standards, design, and playbooks in one place.

---

*Sigma Working With AI Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
