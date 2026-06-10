# Appendix — Accessibility

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers accessibility and inclusive design — what we hold ourselves to so that what we build works for everyone. Inclusiveness, kindness, and consideration are part of how we work, not a compliance checkbox; this appendix makes the default explicit. It is also the bar for any AI agent building interfaces in our repos: match it, and surface any deviation (see [§8 of the standard, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

## 1. Accessible by Default

- **Accessibility is the baseline, not a feature.** It's designed and built in from the first commit — never a retrofit, never a backlog item labelled "a11y later". Retrofitting is more work for a worse result.
- **Assume a wider audience than yourself.** People use keyboards, screen readers, switch devices, magnification, captions, and reduced motion. People are also tired, on a small screen, in bright sun, one-handed. Building for them is building for everyone.
- **Kindness is a requirement.** Clear language, forgiving forms, honest error messages, no dark patterns. Consideration for the person on the other side of the screen is a quality bar, and we hold it.

## 2. The Bar — WCAG 2.2 AA

- **WCAG 2.2 Level AA** is the minimum for anything user-facing. Its four principles — **Perceivable, Operable, Understandable, Robust** — are the frame.
- **Verified, not assumed.** Accessibility is reviewed like any other requirement (see the [Frontend Accessibility Review playbook](../playbooks/frontend-accessibility-review.md)) and tested with real assistive technology — not just an automated scan, which catches perhaps a third of issues.

## 3. What "Default" Means in Practice

- **Semantic HTML first.** A real `<button>`, `<a>`, `<label>`, `<nav>`, correct heading order — the platform gives you accessibility for free when you use the right element. ARIA patches what the platform can't express; it's not a substitute.
- **Keyboard-complete.** Everything operable by mouse is operable by keyboard, in a logical order, with a visible focus indicator and no keyboard traps.
- **Screen-reader coherent.** Meaningful names, roles, and states; images have alt text (or are marked decorative); live regions announce change.
- **Perceivable.** Text contrast ≥ 4.5:1 (3:1 for large text and UI), never colour alone to carry meaning, content reflows to 320px without loss.
- **Forgiving forms.** Labels tied to inputs, errors described in text and linked to the field, no time pressure you don't truly need.
- **Respect preferences.** Honour `prefers-reduced-motion` and `prefers-color-scheme`; don't autoplay or flash.
- **Internationalisation.** `lang` set, text allowed to expand, layouts mirror for RTL, dates/numbers/names localised.

## 4. Beyond the Interface

Consideration doesn't stop at the UI. Documentation is written to be understood (see the [Documentation Review playbook](../playbooks/documentation-review.md)); diagrams carry text alternatives; communication is plain and patient. The same DNA, everywhere.

## 5. The Checklist (PR-time)

- [ ] Semantic HTML; ARIA only where the platform can't express it
- [ ] Fully keyboard operable, logical focus order, visible focus
- [ ] Names/roles/states correct; images have alt text or are marked decorative
- [ ] Contrast meets AA; meaning never carried by colour alone
- [ ] Forms have linked labels and text error messages
- [ ] `prefers-reduced-motion` / `prefers-color-scheme` respected
- [ ] Checked with a screen reader, not just an automated scan

---

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/).
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).
- [MDN — Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility).
- [The A11Y Project](https://www.a11yproject.com/).

---

*Sigma Accessibility Appendix — v1.0 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
