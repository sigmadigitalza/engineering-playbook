# Sigma Engineering Playbook — References

A consolidated bibliography of every external source cited across the Sigma
Engineering Playbook — the standards, language appendices, practice guides,
review playbooks, design foundations, and the "Good Ideas" reading list —
organised by discipline. Each link is listed once, under its best-fit section.

**Using this in NotebookLM:** upload this file as a source, or add individual
URLs as web sources. Sections map to the playbook's own structure, so you can
pull in just the disciplines you need.

_Generated 2026-07-03. 180+ sources across 14 disciplines._

---

## Core Standards & Frameworks

- [NASA/JPL — The Power of 10: Rules for Developing Safety-Critical Code](https://spinroot.com/gerard/pdf/P10.pdf)
- [SEI CERT Secure Coding Standards](https://cmu-sei.github.io/secure-coding-standards/)
- [NIST Secure Software Development Framework (SP 800-218)](https://csrc.nist.gov/pubs/sp/800/218/final)
- [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/)
- [The Twelve-Factor App](https://12factor.net/)
- [Release It! — Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)

## JavaScript / TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [tsconfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript — strict mode](https://www.typescriptlang.org/tsconfig/#strict)
- [MDN Web Docs — JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Deno documentation](https://docs.deno.com/runtime/)

## Go

- [Effective Go](https://go.dev/doc/effective_go)
- [The Go Programming Language Specification](https://go.dev/ref/spec)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- [Go Proverbs](https://go-proverbs.github.io/)
- [Go Standard Library (pkg.go.dev)](https://pkg.go.dev/std)

## Kotlin / Android / JVM

- [Kotlin documentation](https://kotlinlang.org/docs/home.html)
- [Kotlin Coroutines guide](https://kotlinlang.org/docs/coroutines-guide.html)
- [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [Android — Guide to app architecture](https://developer.android.com/topic/architecture)
- [Jetpack Compose documentation](https://developer.android.com/develop/ui/compose/documentation)
- [Effective Java — Joshua Bloch](https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/)

## Godot / GDScript

- [Godot documentation](https://docs.godotengine.org/en/stable/)
- [GDScript style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
- [Godot — Best practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/index.html)

## Version Control & Release

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Pro Git (book)](https://git-scm.com/book)
- [GitHub CLI](https://cli.github.com/)
- [lazygit](https://github.com/jesseduffield/lazygit)

## CI/CD, DevOps & GitHub Actions Security

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [GitHub Actions — Secure Use Reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Security hardening deployments with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Keeping your actions up to date with Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot)
- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- [OpenSSF Scorecard](https://scorecard.dev/)
- [OpenSSF scorecard-action](https://github.com/ossf/scorecard-action)
- [zizmor — GitHub Actions static analysis](https://github.com/woodruffw/zizmor)
- [actionlint](https://github.com/rhysd/actionlint)
- [step-security/harden-runner](https://github.com/step-security/harden-runner)
- [actions/dependency-review-action](https://github.com/actions/dependency-review-action)
- [StepSecurity — tj-actions/changed-files compromise (March 2025)](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised)
- [GitHub Security blog — supply-chain security](https://github.blog/security/supply-chain-security/)
- [GitHub Actions runner images (releases / SBOM)](https://github.com/actions/runner-images/releases)
- [Blacksmith — How to reduce spend in GitHub Actions](https://www.blacksmith.sh/blog/how-to-reduce-spend-in-github-actions)
- [Blacksmith — Concurrency in GitHub Actions](https://www.blacksmith.sh/blog/protect-prod-cut-costs-concurrency-in-github-actions)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [DORA — DevOps Research and Assessment](https://dora.dev/)

## Repository Setup & Governance

- [GitHub — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub — Managing rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [GitHub — About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub — Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [GitHub — Repository ruleset REST API](https://docs.github.com/en/rest/repos/rules)
- [GitHub — About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub — Configuring private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository)
- [GitHub — Securing your repository (security & analysis settings)](https://docs.github.com/en/code-security/getting-started/securing-your-repository)

## API Design

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [RFC 7396 — JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396)
- [RFC 6902 — JSON Patch](https://www.rfc-editor.org/rfc/rfc6902)
- [RateLimit header fields for HTTP (IETF draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [JSON:API Specification](https://jsonapi.org/format/)
- [GraphQL Specification](https://spec.graphql.org/)
- [GraphQL — Best Practices](https://graphql.org/learn/best-practices/)
- [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [Google API Design Guide (AIPs)](https://google.aip.dev/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [GitHub REST API Reference](https://docs.github.com/en/rest)
- [GitHub GraphQL API Reference](https://docs.github.com/en/graphql)

## Databases

- [PostgreSQL — ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL — Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL — CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL — Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [PostgreSQL — pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [pganalyze — blog (safer migrations series)](https://pganalyze.com/blog)
- [Stripe Engineering — Online migrations at scale](https://stripe.com/blog/online-migrations)
- [GitHub Engineering — gh-ost online migration tool](https://github.blog/engineering/databases/gh-ost-github-s-online-migration-tool-for-mysql/)
- [gh-ost](https://github.com/github/gh-ost)
- [Percona — pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html)
- [MySQL — Online DDL Operations](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-operations.html)
- [SQLite — ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [Use The Index, Luke!](https://use-the-index-luke.com/)

## Code Review & Documentation

- [Conventional Comments](https://conventionalcomments.org/)
- [Google — Code Review Developer Guide (eng-practices)](https://google.github.io/eng-practices/review/)
- [SmartBear — Best Practices for Peer Code Review](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)
- [Karl Wiegers — Humanizing Peer Reviews (PDF)](https://www.processimpact.com/articles/humanizing_reviews.pdf)
- [Modern Code Review: A Case Study at Google](https://research.google/pubs/modern-code-review-a-case-study-at-google/)
- [Diátaxis — a framework for technical documentation](https://diataxis.fr/)
- [Write the Docs — topic guides](https://www.writethedocs.org/guide/)
- [AGENTS.md — an open format for guiding coding agents](https://agents.md/)

## Web Security

- [OWASP Top 10 (web)](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS — Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [web.dev — Strict CSP guide](https://web.dev/articles/strict-csp)
- [MDN — Content-Security-Policy reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [The Tangled Web — Michal Zalewski](https://nostarch.com/tangledweb)
- [Reflections on Trusting Trust — Ken Thompson](https://www.cs.cmu.edu/~rdriley/487/papers/Thompson_1984_ReflectionsonTrustingTrust.pdf)

## Web Performance

- [web.dev — Most effective ways to improve Core Web Vitals](https://web.dev/articles/top-cwv)
- [web.dev — Core Web Vitals overview](https://web.dev/articles/vitals)
- [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp)
- [web.dev — Optimize INP](https://web.dev/articles/optimize-inp)
- [web.dev — Optimize CLS](https://web.dev/articles/optimize-cls)
- [MDN — Performance API reference](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [Google Lighthouse](https://github.com/GoogleChrome/lighthouse)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [PageSpeed Insights API docs](https://developers.google.com/speed/docs/insights/v5/get-started)
- [HTTP Archive — Web Almanac](https://almanac.httparchive.org/)
- [web-vitals library (RUM)](https://github.com/GoogleChrome/web-vitals)

## Accessibility

- [WCAG 2.2 (W3C Recommendation)](https://www.w3.org/TR/WCAG22/)
- [How to Meet WCAG 2.2 (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [MDN — Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [The A11y Project](https://www.a11yproject.com/)
- [The A11y Project — Checklist](https://www.a11yproject.com/checklist/)
- [Deque axe-core — rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Inclusive Components — Heydon Pickering](https://inclusive-components.design/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse — accessibility audits](https://developer.chrome.com/docs/lighthouse/accessibility/)

## Reliability, SRE & Incident Response

- [Google — Site Reliability Engineering (book)](https://sre.google/sre-book/table-of-contents/)
- [Google SRE — all books](https://sre.google/books/)
- [Google SRE Book — Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
- [Google SRE Book — Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook — Postmortem Culture](https://sre.google/workbook/postmortem-culture/)
- [Etsy — Blameless PostMortems (John Allspaw)](https://www.etsy.com/codeascraft/blameless-postmortems)
- [How Complex Systems Fail — Richard Cook](https://how.complexsystems.fail/)
- [PagerDuty — Postmortem process](https://response.pagerduty.com/after/post_mortem_process/)
- [Atlassian — Incident Management Handbook: Postmortems](https://www.atlassian.com/incident-management/handbook/postmortems)
- [VOID — The Verica Open Incident Database](https://www.thevoid.community/)
- [Accelerate — Forsgren, Humble & Kim](https://itrevolution.com/product/accelerate/)
- [AWS Health Dashboard](https://health.aws.amazon.com/health/status)
- [GitHub Status](https://www.githubstatus.com/)
- [npm Status](https://status.npmjs.org/)
- [Stripe Status](https://status.stripe.com/)
- [Cloudflare Status](https://www.cloudflarestatus.com/)

## Working With AI

- [Claude Code](https://claude.com/claude-code)
- [GitHub Copilot](https://github.com/features/copilot)

## Design — Perception, Typography & Motion

**Perception & interaction**

- [Laws of UX](https://lawsofux.com)
- [Nielsen Norman Group](https://www.nngroup.com)
- [Interaction Design Foundation](https://www.interaction-design.org)
- [Smashing Magazine](https://www.smashingmagazine.com)
- [Material Design 3](https://m3.material.io)
- [Apple — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

**Typography**

- [Practical Typography — Matthew Butterick](https://practicaltypography.com/)
- [The Elements of Typographic Style Applied to the Web](https://webtypography.net/)
- [A List Apart — More Meaningful Typography](https://alistapart.com/article/more-meaningful-typography/)
- [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Material 3 — Typography](https://m3.material.io/styles/typography)

**Motion**

- [The UX in Motion Manifesto — Issara Willenskomer](https://medium.com/ux-in-motion/creating-usability-with-motion-the-ux-in-motion-manifesto-a87a4584ddc)
- [Val Head — books](https://valhead.com/books/)
- [Animation at Work — Rachel Nabors (A Book Apart)](https://abookapart.com/products/animation-at-work)
- [Material 3 — Motion](https://m3.material.io/styles/motion)
- [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [W3C WAI — WCAG technique C39 (reduce motion)](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)

## Foundational Essays & Papers ("Good Ideas")

- [The Grug Brain Developer](https://grugbrain.dev/)
- [Choose Boring Technology — Dan McKinley](https://boringtechnology.club/)
- [Locality of Behaviour](https://htmx.org/essays/locality-of-behaviour/)
- [HTMX Essays](https://htmx.org/essays/)
- [Out of the Tar Pit — Moseley & Marks](https://curtclifton.net/papers/MoseleyMarks06a.pdf)
- [The Rise of "Worse is Better" — Richard Gabriel](https://www.dreamsongs.com/RiseOfWorseIsBetter.html)
- [No Silver Bullet — Fred Brooks](http://www.cs.unc.edu/techreports/86-020.pdf)
- [YAGNI — Martin Fowler](https://martinfowler.com/bliki/Yagni.html)
- [On the Criteria To Be Used in Decomposing Systems into Modules — David Parnas](https://www.win.tue.nl/~wstomv/edu/2ip30/references/criteria_for_modularization.pdf)
- [End-to-End Arguments in System Design — Saltzer, Reed & Clark](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf)
- [Programming as Theory Building — Peter Naur](https://pages.cs.wisc.edu/~remzi/Naur.pdf)
- [A Philosophy of Software Design — John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/book.php)
- [Fallacies of Distributed Computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing)
- [Sagas — Garcia-Molina & Salem (1987)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)
- [Designing Data-Intensive Applications — Martin Kleppmann](https://dataintensive.net/)
- [Falsehoods Programmers Believe About Names](https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/)
- [The Joel Test — Joel Spolsky](https://www.joelonsoftware.com/2000/08/09/the-joel-test-12-steps-to-better-code/)
- [The Law of Leaky Abstractions — Joel Spolsky](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/)
- [Things You Should Never Do, Part I — Joel Spolsky](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)
- [Teach Yourself Programming in Ten Years — Peter Norvig](https://norvig.com/21-days.html)
- [The Story of Mel](https://users.cs.utah.edu/~elb/folklore/mel.html)
- [xkcd 927 — Standards](https://xkcd.com/927/)
- [xkcd 1205 — Is It Worth The Time?](https://xkcd.com/1205/)
- [xkcd 936 — Password Strength](https://xkcd.com/936/)
