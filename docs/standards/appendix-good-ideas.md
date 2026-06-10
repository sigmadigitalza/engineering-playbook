# Appendix — Good Ideas

*Companion to the [Sigma Engineering Standards](./sigma-engineering-standards.md). The other appendices are about how we ship; this one is about why we think this way. An annotated reading list — essays, papers, books, and one or two jokes — that have shaped good engineering thinking, and ours.*

*Some of these are arguments. Some are warnings. A few are just funny. All of them earn their place by changing how a thoughtful engineer works after encountering it.*

---

## 1. Complexity & Pragmatism

The largest source of pain in software is complexity we created ourselves. These name the pattern and propose the antidote.

**[The Grug Brain Developer](https://grugbrain.dev/)** — Carson Gross
Grug think complexity demon big bad. Grug think factory factories and "clever" abstractions invite complexity demon to project. Grug recommend simple code, say no often, sometimes hit production with club. Re-read every six months. The one essay everyone here ends up quoting, for a reason.

**[The Twelve-Factor App](https://12factor.net/)** — Adam Wiggins
Twelve operational principles for cloud-native services. Config in env, stateless processes, port binding, disposable workers, dev/prod parity. Most of its advice has aged better than the platforms it was written on.

**[Choose Boring Technology](https://boringtechnology.club/)** — Dan McKinley
Every team has a finite number of "innovation tokens." Spend them deliberately. The newest framework on Hacker News is usually a poor place to spend one.

**[Locality of Behaviour](https://htmx.org/essays/locality-of-behaviour/)** — Carson Gross
Code that is read together should live together. The point of splitting things across 14 files is so the reader can ignore 13. If understanding one requires opening four, the split made things worse.

**[Out of the Tar Pit](https://curtclifton.net/papers/MoseleyMarks06a.pdf)** — Ben Moseley & Peter Marks (2006)
A careful taxonomy of complexity: essential vs accidental, state vs control. If you read one academic paper from this list, this is the one. Pairs naturally with Ousterhout's book (see §2).

**[Worse is Better](https://www.dreamsongs.com/RiseOfWorseIsBetter.html)** — Richard Gabriel
The argument that "the right thing" loses, in practice, to "good enough, shipped, simple to implement, adaptable." Four decades of Unix vs Lisp suggest he was onto something. Pairs with his later self-rebuttals on the same site.

**[No Silver Bullet](http://www.cs.unc.edu/techreports/86-020.pdf)** — Fred Brooks (1986)
No single development practice will deliver a 10× productivity gain. The hard parts of software are irreducible — invention, specification, design. Methodology fads come and go; this stays true.

**[YAGNI](https://martinfowler.com/bliki/Yagni.html)** — Martin Fowler
"You Aren't Gonna Need It." Speculative generality is borrowed complexity at compound interest. Build what you need; the future is allowed to change its mind.

---

## 2. Architecture & Foundations

Writings on modularity and design age unusually well.

**[On the Criteria to Be Used in Decomposing Systems into Modules](https://www.win.tue.nl/~wstomv/edu/2ip30/references/criteria_for_modularization.pdf)** — David Parnas (1972)
Modules should hide design decisions, not just group routines by execution order. The single best paper on what "encapsulation" actually means. Fifty years old; still right.

**[End-to-End Arguments in System Design](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf)** — Saltzer, Reed & Clark (1984)
Reliability and integrity guarantees belong at the layer that knows what "correct" means — usually the application. The middle of the stack often shouldn't try. This is why we validate at the boundary, every time.

**[Programming as Theory Building](https://pages.cs.wisc.edu/~remzi/Naur.pdf)** — Peter Naur (1985)
A program is a *theory* held in the minds of its builders. When the team leaves, the theory leaves, even if the code remains. Hire and document for the theory, not just the code.

**[A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php)** — John Ousterhout (book)
Deep modules with narrow interfaces. "Define errors out of existence." Short, opinionated, a few hours' read. Probably the most useful single book to put in a new hire's hand.

---

## 3. Distributed Systems & Failure

Once a network is involved, intuition turns into liability.

**[The Fallacies of Distributed Computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing)** — L. Peter Deutsch et al
Eight false beliefs: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology doesn't change, there is one administrator, transport cost is zero, the network is homogeneous. Every one has bitten us.

**[How Complex Systems Fail](https://how.complexsystems.fail/)** — Richard I. Cook (1998)
Eighteen brief observations from a medical-safety researcher. None is about software; all of them are. "Catastrophe is always just around the corner." "Hindsight biases post-accident assessments." Worth re-reading after every postmortem.

**[Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)** — Hector Garcia-Molina & Kenneth Salem (1987)
The original paper on the saga: break a long-lived transaction into a sequence of smaller ones, each with a compensating action that undoes it on failure. When you can't hold a lock or a two-phase commit across services, you make forward progress and *compensate* instead. Four decades on, it's the pattern under every multi-step, cross-service workflow that has to unwind cleanly when a later step fails.

**[Designing Data-Intensive Applications](https://dataintensive.net/)** — Martin Kleppmann (book)
The reference work for backend engineers in the age of distributed databases, streaming, and consistency trade-offs. Not light reading. Worth the investment.

**[Release It!](https://pragprog.com/titles/mnee2/release-it-second-edition/)** — Michael Nygard (book)
The stability patterns we lean on in [main-standard §5](./sigma-engineering-standards.md#5-resilience-patterns) — circuit breaker, bulkhead, fail fast, steady state — come from here. Reads like a war diary.

---

## 4. Security & Trust

**[Reflections on Trusting Trust](https://www.cs.cmu.edu/~rdriley/487/papers/Thompson_1984_ReflectionsonTrustingTrust.pdf)** — Ken Thompson (1984)
Thompson's Turing Award lecture. You can audit every line of your source code and still be owned, if you don't trust your compiler. The original supply-chain attack paper, written four decades before the term existed.

**[Falsehoods Programmers Believe About Names](https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/)** — Patrick McKenzie (2010)
"People have exactly one canonical full name." (False.) "Names are written in ASCII." (False.) The whole "Falsehoods..." genre that followed — about time, addresses, phone numbers, geography, dates — is essential humility training.

**[The OWASP Top 10](https://owasp.org/www-project-top-ten/)**
Not an essay, a baseline. Read it once a year. It changes less than you'd think — and where it does change, that's the signal.

---

## 5. Operations & Craft

**[Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/)** — Google (book, free online)
SLOs, error budgets, blameless postmortems, toil. The vocabulary of modern ops. Not every team needs Google's scale; every team benefits from Google's clarity on what "reliable" means as a measurable thing.

**[Accelerate](https://itrevolution.com/product/accelerate/)** — Forsgren, Humble & Kim (book)
The DORA research distilled. Four metrics — deployment frequency, lead time, MTTR, change failure rate — that actually correlate with organisational performance. The data is more convincing than any single methodology.

**[The Joel Test](https://www.joelonsoftware.com/2000/08/09/the-joel-test-12-steps-to-better-code/)** — Joel Spolsky (2000)
Twelve yes/no questions about your team. "Do you use source control?" "Can you make a build in one step?" Dated in specifics, evergreen in spirit. If a team scores below 10, ship culture before code.

**[The Law of Leaky Abstractions](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/)** — Joel Spolsky (2002)
All non-trivial abstractions leak. The TCP stack doesn't truly make the network look reliable. ORMs don't truly make SQL go away. Knowing the layer below your abstraction is not optional.

**[Things You Should Never Do, Part I](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)** — Joel Spolsky (2000)
The case against rewriting from scratch. The instinct that the old code is bad because you don't understand it is *almost always* wrong. Every line of weird code is a bug someone hit and fixed.

**[Teach Yourself Programming in Ten Years](https://norvig.com/21-days.html)** — Peter Norvig
Skill takes ten years; books promising it in 24 hours are lying. Useful for managing your own and your team's expectations.

---

## 6. Stack-Adjacent Canon

Mostly short, mostly free, all directly applicable.

**[Effective Go](https://go.dev/doc/effective_go)** — Go team
The Go cultural document. Even if you've read it, re-read it; it's compact.

**[Go Proverbs](https://go-proverbs.github.io/)** — Rob Pike
"Don't communicate by sharing memory; share memory by communicating." "A little copying is better than a little dependency." "Errors are values." Twelve aphorisms that explain a lot of Go's odder choices.

**[HTMX Essays](https://htmx.org/essays/)** — Carson Gross
The full collection, beyond Locality of Behaviour. "Hypermedia-Driven Applications," "The 'No Build' Step," "REST: deeper look." Even if you never ship htmx in production, the essays sharpen your thinking about web architecture and the dependency-minimal stance in our JS/TS appendix.

**[Effective Java](https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/)** — Joshua Bloch (book)
Most of it applies to Kotlin too. Builders, "favour composition over inheritance," "minimise mutability" — foundations that go straight into our Android/Kotlin appendix.

---

## 7. Witty & Cultural

Software is a human craft. The best writing about it doesn't pretend otherwise.

**[The Story of Mel](https://users.cs.utah.edu/~elb/folklore/mel.html)** — Ed Nather (1983)
A poem about a Real Programmer optimising drum-memory loops by hand. The genre is "ballads about programmers who are no longer with us." Read it aloud sometime — it holds up.

**[The Rise of "Worse is Better"](https://www.dreamsongs.com/RiseOfWorseIsBetter.html)** — Richard Gabriel
The original essay plus the author's own decades of arguing with himself in followups. If you've ever felt torn between "the right thing" and "shipping," Gabriel has been there longer than you.

**[xkcd 927 — Standards](https://xkcd.com/927/)**
"There are 14 competing standards. Fourteen?! Ridiculous! We need to develop one universal standard..." Read before proposing a new internal format.

**[xkcd 1205 — Is It Worth The Time?](https://xkcd.com/1205/)**
The automation-vs-doing-it-by-hand chart. Print it.

**[xkcd 936 — Password Strength](https://xkcd.com/936/)**
The reason "correct horse battery staple" entered the security vernacular. Still right about humans and passwords fifteen years on.

---

## 8. A Few Books, Briefly

For when you want long-form.

- **The Pragmatic Programmer** — Hunt & Thomas. Orthogonality, DRY, tracer bullets, broken windows. The cultural fundamentals.
- **The Mythical Man-Month** — Fred Brooks. Aged in particulars (OS/360!), evergreen in essence. "Adding manpower to a late software project makes it later."
- **Domain-Driven Design** — Eric Evans. Long, dense, foundational for any team doing serious modelling.
- **Designing Data-Intensive Applications** — Kleppmann (see §3).
- **A Philosophy of Software Design** — Ousterhout (see §2).
- **Release It!** — Nygard (see §3).
- **Site Reliability Engineering** — Google (see §5).
- **Accelerate** — Forsgren et al (see §5).
- **The Manager's Path** — Camille Fournier. The one book to give an engineer thinking about their first lead role.

---

## 9. How To Use This

- One a week. Pick something from this list, read it, talk it over with the team, agree what (if anything) changes in how we work.
- Onboarding minimum: §1 in full. Grug, 12 Factor, Choose Boring, Locality of Behaviour, No Silver Bullet. These are the cultural baseline.
- Add to this list. Anything any Sigma engineer finds genuinely changed-how-they-think gets a PR. The bar is real impact, not citation completeness.

---

*Sigma Good Ideas Appendix — v1.2 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
