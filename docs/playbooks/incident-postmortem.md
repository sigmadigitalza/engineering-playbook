# Incident Postmortem Playbook

A strategy, a copy-paste postmortem template, and a Claude Code prompt for writing and reviewing post-incident reviews. Pairs with the [Web SRE playbook](web-sre.md) — Web SRE handles the live incident, this one handles what we learn from it. Blameless by construction, mode-routed for drafting and reviewing, and approval-gated so the assistant never contacts people, files tickets, or touches monitoring on its own.

---

## Strategy

**Postmortems are a learning artifact, not a punishment artifact.** The work of a postmortem is to extract durable lessons from a failure that the system already paid for. If the document reads as a search for who to blame, engineers stop telling the truth in incidents — they hedge in chat, edit timelines, omit the bit where they tried the wrong thing first. You lose the data the postmortem exists to capture. The cost of a non-blameless culture is paid every incident from then on, in the form of slower diagnosis. This is the central thesis from Allspaw's "Blameless PostMortems" and the Google SRE Book's chapter on Postmortem Culture, and the prompt encodes it as a non-negotiable directive rather than a stylistic preference.

**Blameless does not mean accountability-free.** "Blameless" is consistently misread as "no one is responsible." What it actually means: separate the *human* (whose action was reasonable given what they knew at the time) from the *system* (which let a single human action cause a customer-impacting outage). A blameless postmortem still names actions and decisions — it just frames them as inputs to the system's behavior rather than character judgments. Action items target the system: better guardrails, better signals, better runbooks, better defaults. They never target a person's diligence ("be more careful," "double-check before running"). The prompt rejects person-targeted action items by name.

**Most outages have multiple contributing factors, not one root cause.** Richard Cook's "How Complex Systems Fail" is the canonical text here: complex systems run in a degraded mode continuously, and incidents happen when several latent failures align. A postmortem that lands on a single root cause has almost always stopped at the first plausible explanation. The prompt forces a contributing-factors list (plural), uses a 5-whys / causal-chain technique to dig past the first answer, and explicitly refuses "root cause: human error" as a terminal answer — that's a starting point, not a conclusion.

**The action items are the point.** Everything else in a postmortem is in service of producing action items that are specific, owned, dated, and tied to either prevention, detection, or mitigation. The rubric the prompt enforces is borrowed from PagerDuty and Atlassian's incident response guides, and the failure mode it's designed to prevent is the "shape-shifting" action item — "improve communication," "be more careful with deploys," "consider better monitoring." These cannot be completed, cannot be tracked, and produce no learning. The prompt rejects them at draft time and again at review time.

**Severity threshold for *writing one* is broader than people expect.** Customer-impacting outages get postmortems by default, but the prompt also pulls in: near-misses (we got lucky), incidents resolved entirely by automation (because automation can hide rot), incidents where the on-call humans were significantly stressed, and incidents where the on-call response was unusually slow even if customer impact was small. The cost of writing a postmortem for a small incident is low; the cost of *not* writing one for a near-miss is the next outage where the luck doesn't hold.

**The "where we got lucky" section is the bit teams skip.** It's also one of the highest-signal sections — it's where you find out the customer-facing damage was 5% of what it could have been, or that the bad deploy happened to ship at 03:00 instead of peak. Calling these out names the latent risks the system is still carrying, even though the visible incident is over. The prompt makes this a required section, not optional.

**Two modes, same shape as the SRE prompt:**

- **Mode 1 — Draft postmortem.** Given chat logs, alert history, deployment timeline, the repo, and a brief, produce a first-draft postmortem document populated with the standard template. The draft is then circulated to the humans who lived the incident for correction and addition.
- **Mode 2 — Review postmortem.** Given an existing draft, audit it against the rubric: blameless tone, contributing-factors plurality, action-item quality, completeness of the timeline, presence of "what went well" and "where we got lucky," redaction of customer / employee / vendor data.

**One prompt covers both because the rubric is the same in both directions.** The drafting mode applies the rubric forwards (produce a document that meets it); the review mode applies the same rubric backwards (audit a document for compliance). Splitting them into two prompts duplicates the criteria and risks drift between them.

**Approval-gated, but the gates are different from SRE.** The SRE prompt gates network probes against production. The postmortem prompt gates *people-and-systems* actions: contacting individuals for clarification, posting in Slack channels, filing tickets in Jira / Linear, modifying alerts or dashboards, sending email summaries. None of these happen without explicit, in-conversation authorization, even if the assistant has the access. Reading repo content, deployment logs, exported chat transcripts, and alert history that the user provides is free.

**Privacy and redaction posture.** Postmortems get circulated more widely than incident-channel discussion. Customer data that appeared in error logs, employee names tied to specific actions where blame might attach, vendor confidentiality where a SaaS dependency contributed — all need redaction or anonymization in the published version. The prompt has a redaction pass before producing the final draft, not as a separate step.

**Distribution and follow-through is part of the system, not a footnote.** A postmortem that nobody reads and whose action items nobody tracks is theatre. The playbook spells out where postmortems live (the team's docs repo or wiki), who's expected to read each one (the team that owns the system, plus broader engineering for high-severity), how action items are tracked through to completion (linked to tickets, owner accountable in standups), and the cadence for revisiting old postmortems (quarterly review for trends, repeat causes, and unfinished action items). The prompt produces a distribution checklist alongside the document.

**Specific traps to encode:**

1. **Single-root-cause-itis.** If the postmortem says "root cause: human error" or "root cause: bad deploy," the analysis is not done. The prompt asks "and why was that possible?" until the answer lands at a system property (a missing check, an ambiguous interface, an unguarded path), then names the chain.

2. **Hindsight bias.** The postmortem reads what the responder knew at 02:14 with the knowledge of what happened at 02:31. The fix is to write the timeline strictly in the order events were observed by the humans involved, with sources for each step (alert ID, message link, commit SHA, log line). The prompt enforces sources on every timeline entry.

3. **Action item soup.** Twenty action items, none owned, none dated. The prompt caps the action-item count at what's actually achievable (typically 3–7) and rejects unowned or undated items. Better to have five tracked and completed than fifteen that decay.

4. **Performative blamelessness.** The document uses passive voice everywhere ("a deploy was made," "an alert was missed") and reads as evasive rather than principled. Real blameless writing names the action ("the on-call responder ran the migration script") and *then* asks why the system allowed that action to cause an outage. The prompt models this voice rather than scrubbing all agency.

5. **Skipping the "what went well" section.** When everything feels bad, teams skip the recognition section. This is wrong: the alert that fired correctly, the runbook step that worked, the rollback that was clean — these are the parts of the system you want to keep, and naming them protects them from being optimized away in the action-item rush.

---

## The Postmortem Template

Copy this into your team's docs / wiki when an incident hits the threshold below. The prompt populates this template in Mode 1 and audits filled copies in Mode 2.

````markdown
# Postmortem: <short incident title>

- **Severity:** SEV-1 / SEV-2 / SEV-3 / Near-miss
- **Status:** Draft / In review / Published
- **Date of incident:** YYYY-MM-DD
- **Detected at (UTC):** YYYY-MM-DD HH:MM
- **Resolved at (UTC):** YYYY-MM-DD HH:MM
- **Duration of customer impact:** Xh Ym  (note if different from detection-to-resolution)
- **Authors:** <names>
- **Incident commander:** <name>
- **On-call responder(s):** <names>
- **Stakeholders informed during incident:** <list — eng leadership, support, sales, customers if applicable>

## Summary

Three to four lines, no jargon. What happened. Who was affected. What was done to resolve it. A non-engineer should be able to read this and understand the shape of the event.

## Customer impact

Concrete and measured, not adjectives. Examples:
- Requests failed: <count or rate, with timeframe>
- Users affected: <count or %, with how it was determined>
- Revenue impact: <currency value or "not material" with reasoning>
- SLO burn: <% of monthly error budget consumed>
- Support load: <ticket count, escalations>
- External communication: <status page updates posted, customer emails sent>

## Timeline (UTC)

Strictly chronological. Each entry has a timestamp, an actor, the action, and a source (alert ID, message link, commit SHA, log query).

| Time (UTC) | Actor | Event | Source |
|------------|-------|-------|--------|
| HH:MM | system | Alert fires: <name> | <alert ID / link> |
| HH:MM | <name> | Acknowledges page | <pagerduty link> |
| HH:MM | <name> | Posts in #incidents | <message link> |
| HH:MM | <name> | First hypothesis: <…> | <message link> |
| HH:MM | <name> | Mitigation attempted: <…> | <commit / runbook step> |
| HH:MM | <name> | Mitigation confirmed: <…> | <dashboard link / log query> |
| HH:MM | <name> | Customer comms posted | <status page link> |
| HH:MM | <name> | Resolved | <message link> |

## Root cause and contributing factors

Plural by default. Most incidents have a chain of small failures, not one cause.

Use 5-whys or a causal chain. Stop only when the answer is a system property the team can act on.

1. **<Factor 1>** — <description>. *Why was this possible?* <next link in the chain>
2. **<Factor 2>** — <description>.
3. **<Factor 3>** — <description>.

If a person ran a command that triggered the outage, the factor is *not* "human error" — it's whatever system property allowed that command to cause the outage (missing guardrail, ambiguous runbook, no dry-run mode, no review on a destructive action).

## What went well

Real recognition. Specific. Examples to draw from:
- The alert fired within X minutes of impact starting.
- The runbook for <symptom> was followed without modification.
- The rollback completed cleanly in Y minutes.
- The on-call escalated to <team> at the right moment.
- Customer comms went out on the status page within Z minutes.

## What went wrong

The failure modes. Specific. Examples:
- Detection delay: alert fired N minutes after impact began.
- Ambiguous runbook step at <link> — responder had to interpret.
- Missing dashboard for <signal> — responder built an ad-hoc query.
- Escalation gap: <team> wasn't paged for M minutes after the symptom indicated involvement.
- Comms gap: customer-facing status page lagged behind internal awareness.

## Where we got lucky

Often skipped. Always worth writing.

- The bug shipped at 03:00 UTC, off-peak; daytime traffic would have been ~10× worse.
- Customer A was the only one on the affected code path; if Customer B had been live, the impact would have been Z.
- The on-call happened to be the engineer who shipped the change last week — recognized the symptom in 4 minutes; another responder would likely have spent ~30.
- Cache TTLs masked the bad deploy until the rollback shipped — without the cache, full impact would have hit immediately.

## Action items

Each one: owner, due date, ticket link, classification (Prevention / Detection / Mitigation).

| # | Action | Owner | Due | Ticket | Classification |
|---|--------|-------|-----|--------|----------------|
| 1 | <specific action> | <name> | YYYY-MM-DD | <link> | Prevention |
| 2 | <specific action> | <name> | YYYY-MM-DD | <link> | Detection |
| 3 | <specific action> | <name> | YYYY-MM-DD | <link> | Mitigation |

**Reject** items that look like:
- "Be more careful when deploying."
- "Improve communication during incidents."
- "Consider adding monitoring."
- "Review the runbook."

These are not actions. They cannot be completed and cannot be tracked. Replace with: a specific change to a specific file / config / process, owned by a specific person, completable by a specific date.

## Lessons learned

Two to four bullets. The durable takeaways someone reading this in six months should walk away with. Not a recap of the timeline — the lesson behind it.

## Distribution

- Posted to: <wiki link / docs repo path>
- Read by: <team that owns the system>
- Wider read: <list — engineering all-hands, leadership digest, etc.>
- Action items tracked in: <Jira/Linear project>
- Quarterly review: <which review cycle this rolls up to>
````

---

## When to write a postmortem

Required:
- Any SEV-1 or SEV-2 incident.
- Any incident with confirmed customer impact, regardless of duration.
- Any incident requiring a public status page update.
- Any data-loss event, even partial or recoverable.
- Any security incident, even contained.

Strongly encouraged (i.e. write one unless there's a reason not to):
- **Near-misses** — would have been customer-impacting but for luck or a fast catch.
- **Incidents resolved entirely by automation** — automation can mask the underlying degradation.
- **Slow-detection incidents**, even with low impact — the detection delay is the lesson.
- **Repeat incidents** — if it has happened before, the previous postmortem's action items are relevant evidence.

When in doubt, write one. The cost is low and the artifact is durable.

---

## The Prompt

Paste into Claude Code, run from the repo root. Provide chat exports, alert history, deployment timeline, and the brief. For Mode 2, provide the existing draft.

````markdown
You are a senior site reliability engineer running a blameless post-incident review. Your job is either to (1) draft a postmortem document from incident artifacts, or (2) review an existing draft against the team's rubric. Authoritative sources: Google SRE Book (Postmortem Culture: Learning from Failure), Etsy "Blameless PostMortems" by John Allspaw, "How Complex Systems Fail" by Richard Cook, PagerDuty Incident Response docs, Atlassian incident handbook.

# PRIME DIRECTIVES

- **Blameless by construction.** Separate the human (whose action was reasonable given what they knew) from the system (which allowed that action to cause customer impact). Action items target the system, never a person's diligence. Reject "be more careful," "communicate better," "double-check before deploying," and similar non-actions wherever they appear.
- **Multiple contributing factors, not one root cause.** Most incidents are a chain of small failures. If the analysis lands on a single cause — especially "human error" or "bad deploy" — the analysis is not done. Keep asking "and why was that possible?" until the answer is a system property the team can act on.
- **Hindsight-free timeline.** The timeline records what the responders observed in the order they observed it, not what we now know. Every timeline entry has a source (alert ID, message link, commit SHA, log query, dashboard link). No inferred or reconstructed entries without a source.
- **Action items must be specific, owned, dated, and classified.** Each as Prevention, Detection, or Mitigation. Reject any that fail this bar. Better to ship 5 real action items than 15 shape-shifting ones.
- **Approval-gated for people-and-systems actions.** Reading the repo, deployment history, exported chat transcripts, alert exports, and dashboard data the user provides is free. Do NOT contact individuals, post in Slack channels, file tickets, modify alerts or dashboards, or send email without explicit in-conversation authorization. List proposed actions in batches and wait.
- **Redact before publishing.** Customer data that appeared in logs, employee names where blame might attach, vendor confidentiality. Apply redaction in the draft, not as a separate step.
- **Don't fabricate.** If a chat message, commit, or alert is not in the provided artifacts, do not invent it. If a section can't be filled from the artifacts, say so explicitly and flag it for the author to provide.

# MODE SELECTION

Begin by asking which mode applies. If I've already told you, skip the question.

- **Mode 1 — Draft postmortem.** Produce a first-draft postmortem from incident artifacts.
- **Mode 2 — Review postmortem.** Audit an existing draft against the rubric.

Ask for the inputs that mode needs:
- Mode 1: incident brief (1–3 sentences), severity, detected and resolved timestamps in UTC, exported chat transcripts (incident channel), alert history, deployment timeline (commits / SHAs around the window), dashboard or log links if available, list of people involved (commander, on-call, stakeholders).
- Mode 2: the existing postmortem draft (path or pasted content), and any of the Mode 1 inputs the reviewer has access to for cross-checking.

# PHASE 1 — RECONNAISSANCE (all modes)

Do this before any drafting or review. Report briefly.

1. **Artifact inventory.** What did I actually receive? Chat transcripts (timeframe, channel, completeness — were quiet hours included?), alert exports (with IDs), deployment timeline (commit list with timestamps), dashboard snapshots, prior runbook references, customer comms posted. Note gaps.
2. **System under incident.** From the repo: which service(s), which dependencies (link out to the SRE playbook's service-dependency map if present in the repo), which deploy mechanism, which on-call rotation owns it.
3. **Severity & impact framing.** From the brief: severity classification, customer-facing impact scope (count or %, geography, segment if known), duration, SLO context (was the error budget already strained?). Flag if any of these are not stated and need confirmation.
4. **People involved.** Identify by role: incident commander, on-call responder(s), engineers who joined, stakeholders informed. Confirm names against chat transcripts.
5. **Existing artifacts to cross-reference.** Prior postmortems for similar incidents in this system (search `docs/postmortems/`, `docs/incidents/`, wiki path the user provides). Outstanding action items from prior postmortems that may have been relevant.
6. **What I'm missing.** End Phase 1 with a list of gaps and what changes if each is provided. Do not proceed to drafting / review while critical gaps are outstanding (e.g., chat transcript missing for the period the timeline needs to cover) without explicit instruction.

# PHASE 2 — MODE-SPECIFIC WORK

## Mode 1 — Draft postmortem

Populate the standard template (in the playbook). Approach:

### Header
Severity, dates, detected/resolved UTC timestamps, duration of customer impact (note if different from detect-to-resolve — e.g., partial degradation started earlier), authors, incident commander, on-call responder(s), stakeholders informed.

### Summary
3–4 lines, no jargon. What happened, who was affected, what was done. A non-engineer reader should grasp the shape of the event from the summary alone.

### Customer impact
Concrete, measured. Requests failed (with timeframe), users affected (count or %, with how determined), revenue impact (currency value or "not material" with reasoning), SLO burn (% of error budget), support load, external comms posted.

If a number isn't supportable from the artifacts, mark "TK — author to confirm" rather than guess.

### Timeline (UTC)
Build strictly from the chat transcripts, alerts, and deployment log. Each row: time, actor, event, source. Include:
- Alert firing (with alert ID).
- First human acknowledgement.
- First hypothesis posted.
- Mitigation attempts (commits, runbook steps, manual actions).
- Successful mitigation confirmation (with the dashboard / log query that showed recovery).
- Customer comms postings (status page updates).
- Resolution declaration.

Stay strictly chronological. Do not editorialize, summarize, or backfill. If a step in the chain is unclear from the artifacts, flag it for the author rather than reconstructing.

### Root cause and contributing factors
Plural by default. Use a 5-whys / causal chain. Format as a numbered list where each item names a factor and asks "why was this possible?", and the answer becomes the next item. Stop when the answer is a system property (missing check, ambiguous interface, unguarded destructive action, no dry-run, no review).

If your draft of this section contains "human error" or "operator mistake" as a terminal answer, treat that as a starting point and continue the chain.

### What went well
3–6 bullets. Specific. Real recognition. Examples to look for in the artifacts:
- Time-to-acknowledge below the team's target.
- Runbook step followed without modification.
- Clean rollback.
- Correct early escalation.
- Timely customer comms.
- A signal that fired correctly and pointed at the right place.

### What went wrong
3–6 bullets. The failure modes. Examples:
- Detection delay (impact-to-alert gap).
- Ambiguous or stale runbook step.
- Missing dashboard or signal — responder had to build an ad-hoc query.
- Escalation gap.
- Comms gap (internal awareness ahead of external).

### Where we got lucky
2–4 bullets. The bit that's often skipped — what could have been worse and wasn't, due to luck. Examples:
- Off-peak timing.
- Only one customer on the affected code path.
- Cache TTLs masked the bad deploy.
- The on-call happened to be the engineer who shipped the change.

If you can't produce at least one entry here, push back: there's almost always something. Ask the author what could have been worse.

### Action items
3–7 items typically. Each: owner, due date, ticket link, classification (Prevention / Detection / Mitigation).

For each candidate action item, run the rubric:
- Is it specific? (Names a file / config / process to change, or a concrete artifact to produce.)
- Is it owned? (Single person accountable.)
- Is it dated? (Specific date, not "soon" or "next quarter.")
- Is it classified? (Prevention reduces the chance of recurrence; Detection shortens the time-to-know next time; Mitigation reduces blast radius if it does recur.)

If a candidate fails any of these, rewrite it. Reject "improve X," "be more careful with Y," "consider doing Z," "review the runbook." These are not actions.

If owners and dates aren't supportable from the artifacts (i.e. nobody has agreed to take them yet), mark as "TK — to be assigned in postmortem review meeting" rather than fabricating.

### Lessons learned
2–4 bullets. The durable takeaways. Not a recap. The point a future engineer reading this in six months should walk away with.

### Distribution
Propose a distribution plan: where it lives, who reads it, where action items are tracked, which quarterly review it rolls into. Do not actually post or distribute anything.

### Redaction pass
Before producing the final draft, scan for:
- Customer identifiers (account IDs, email addresses, names) — anonymize or aggregate.
- Employee names tied to specific actions where blame might attach — keep in internal version, anonymize for wider distribution.
- Vendor / SaaS dependency confidentiality — confirm with the team before naming a vendor in a published version.
- Secrets / credentials accidentally in error messages or chat copy — redact unconditionally and flag for rotation.

## Mode 2 — Review postmortem

Audit the provided draft against the rubric. Produce findings in the three-bucket format (Phase 3). Specific checks:

### Tone & framing
- **Blameless voice.** Does the draft attribute outcomes to people's character or diligence ("X should have been more careful," "Y didn't follow the process")? Or does it name actions and ask what the system allowed? Flag every instance of person-targeted language.
- **Hindsight bias.** Does the timeline read what was known at each step, or does it leak knowledge from later? Look for phrases like "obviously this would..." or "should have realized..." Flag.
- **Performative passive voice.** Is the draft using passive voice everywhere ("a deploy was made") to avoid naming actions? Real blameless writing names the action and then asks why the system allowed it. Flag if the draft is uniformly evasive.

### Completeness
- **Missing required sections.** Header, Summary, Customer impact, Timeline, Contributing factors, What went well, What went wrong, Where we got lucky, Action items, Lessons learned, Distribution. Flag any missing.
- **Where we got lucky** is present and substantive (not "n/a"). If absent or empty, push back — there's almost always something.
- **Timeline sources.** Every timeline row has a source (alert ID, message link, commit SHA, log query). Flag any rows without sources.
- **Customer impact concreteness.** Are the numbers supported (with the source of the count or %)? Or are they adjectives ("significant," "many users")? Flag adjectives.

### Single-root-cause-itis
- Does the contributing-factors section list one factor or several? If one, push the author to keep asking "and why was that possible?"
- Does any factor terminate at "human error" or "operator mistake"? If so, that's a starting point — flag and ask for the system property below it.

### Action item quality
For each action item, check:
- **Specific** — names a concrete change, not "improve X."
- **Owned** — single named person, not a team or "TBD."
- **Dated** — specific date, not "soon" or "next sprint."
- **Classified** — Prevention, Detection, or Mitigation, named.
- **Tied to a contributing factor.** Each action should reduce the chance of recurrence, shorten time-to-know, or reduce blast radius for one of the named factors. If an action item doesn't trace to a factor, ask why it's here.

Reject any item that reads as: "be more careful," "communicate better," "double-check," "consider adding," "review the runbook." Rewrite suggestions for each.

### Redaction
- Customer identifiers present? Flag for redaction.
- Employee names tied to specific actions where blame might attach? Flag and propose anonymization for wider distribution.
- Vendor confidentiality concerns? Flag for confirmation before publishing.
- Secrets / credentials in pasted error messages or logs? Flag for unconditional redaction and rotation.

### Cross-reference (if Mode 1 inputs available)
If you have the chat transcripts, alerts, and deploy log, spot-check the draft's timeline against the artifacts: are timestamps correct? Are sources what the draft claims? Are any significant events missing from the draft that appear in the artifacts?

# PHASE 3 — REPORT

Three buckets.

## Section A — Findings (Mode 1: draft sections; Mode 2: confirmed compliance with rubric)

In Mode 1: the populated draft, section by section, with TK markers for anything not supportable from the artifacts.

In Mode 2: confirmed sections that meet the rubric, with brief notes on what made them strong.

## Section B — Issues (Mode 2 primary; Mode 1 secondary)

In Mode 2: each rubric violation, ranked by severity, with the specific quote / location, why it fails, and a proposed rewrite.

In Mode 1: gaps in the artifacts that prevented full population — what the author needs to provide next.

## Section C — Critical findings

In Mode 1: anything in the artifacts that constitutes a still-active risk (e.g., the underlying bug isn't fully fixed, only mitigated; secrets were exposed in logs and not yet rotated; a similar latent failure mode exists elsewhere). These get escalation language.

In Mode 2: blameful language naming individuals, missing redactions of customer / secret data, single-root-cause-itis terminating at "human error," or action items so weak that the postmortem fails the rubric end-to-end.

## Section D — Summary

- **Verdict** (Mode 1: ready for author review / needs more artifacts. Mode 2: ready to publish / needs revision / fails rubric — return to author).
- **Top 3 issues** to address next.
- **Distribution recommendation** (where this should live and who should read it once accepted).

# PHASE 4 — IMPLEMENTATION / ACTION

After the report, ASK what to do next. Do nothing automatically.

Possible drafts you can offer to produce (not execute):
- Final draft of the postmortem document with TK markers replaced by author-supplied content.
- A distribution checklist with placeholders.
- A list of tracked tickets to be filed for the action items, with proposed titles and acceptance criteria — the user files them.
- A follow-up agenda for the postmortem review meeting.
- A pattern note for the team's wiki if this incident matches a recurring pattern (link to prior postmortems).

Do NOT:
- Post the document anywhere.
- File tickets.
- Send Slack / email summaries.
- Modify alerts, dashboards, or monitoring config.
- Contact individuals named in the postmortem for clarification — return that as a question to the user.

# CONSTRAINTS

- Do not contact individuals, post in Slack, file tickets, send email, or modify monitoring without explicit in-conversation approval.
- Do not invent timeline entries, alert IDs, commit SHAs, dashboard URLs, on-call handles, ticket numbers, or runbook content.
- Do not allow the contributing-factors section to terminate at "human error" or "operator mistake" — these are starting points, keep asking why.
- Do not allow action items that fail the specific / owned / dated / classified bar. Reject "be more careful," "improve communication," "consider," "review."
- Do not write the timeline with hindsight — record what was observed in the order observed, with sources.
- Do not skip the "where we got lucky" section.
- Do not skip the redaction pass.
- Respect existing team conventions documented in the repo (postmortem template variations, severity definitions, distribution norms) until you have evidence to revisit them.
- If credentials, secrets, or PII appear in any provided artifact, redact in your reply and flag for rotation as a Section C finding.
````

---

## Notes on Using It

- The prompt is most effective with high-quality artifacts. Export the full incident channel (not a curated subset), pull the alert history including any flapping that preceded the incident, and include the full deployment timeline (not just the suspected bad deploy). Phase 1 will tell you what's missing; provide it before drafting.
- Run the prompt on a fresh chat with the artifacts as attachments / pasted content. Don't continue an incident-diagnosis session into a postmortem session — the framing is different and the assistant should approach the artifacts cleanly.
- For Mode 2 reviews, pair this with a human reviewer on the team that owns the system. The prompt catches rubric violations the eye glides past; the human catches local context the prompt can't infer (e.g., "this 'lucky' bit isn't actually lucky, we ship that mitigation deliberately every quarter").
- The action-item rubric is the single most load-bearing part of the system. A postmortem with five real action items that get done is worth ten postmortems with twenty shape-shifting items each. Defend the rubric — when the prompt rejects "improve communication during incidents," resist the temptation to bargain it back in.
- The quarterly review cadence matters as much as the per-incident postmortem. Read the last quarter's postmortems back-to-back, look for repeating contributing factors, and check action-item completion rates. Repeat factors and incomplete items are the highest-signal data the artifact produces.
- For near-misses, the same template still applies but the "customer impact" section becomes "customer impact avoided" — concrete description of what would have happened if the luck or fast catch hadn't held. The "where we got lucky" section is the meat of a near-miss postmortem.

---

## Reference Material

- [Google SRE Book — Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/) — the canonical reference for blameless postmortem culture.
- [Etsy Engineering — Blameless PostMortems by John Allspaw](https://www.etsy.com/codeascraft/blameless-postmortems) — the foundational essay separating human action from system behavior.
- [How Complex Systems Fail — Richard Cook](https://how.complexsystems.fail/) — 18 short observations on complex-system failure modes; informs the multiple-contributing-factors posture.
- [PagerDuty Incident Response Documentation — Postmortems](https://response.pagerduty.com/after/post_mortem_process/) — the operational handbook for running postmortems at scale.
- [Atlassian Incident Management Handbook — Postmortems](https://www.atlassian.com/incident-management/handbook/postmortems) — practical templates and process guidance.
- [Google SRE Workbook — Postmortem Template](https://sre.google/workbook/postmortem-culture/) — the template the Google SRE team uses, which informs the structure here.
- [VOID Report — The Verica Open Incident Database](https://www.thevoid.community/) — a corpus of public postmortems with analysis of what makes them effective.
