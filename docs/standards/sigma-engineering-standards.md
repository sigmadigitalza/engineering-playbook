# Sigma Engineering Standards

*A unified standard for stability, security, resilience, and maintainability — for developers and AI agents shipping into production.*

---

## 0. Preamble

Mission-critical is not a domain — it is a posture. The same patterns that prevent a Mars rover from bricking also prevent a fintech backend from corrupting balances, a tablet from losing a child's learning progress, or a CI/CD pipeline from leaking a key. This document is what we hold ourselves to at Sigma. It is also the contract we expect any AI coding agent operating in our repos to follow.

This standard is deliberately small. It is the spine. Stack-specific translation lives in the appendices; team conventions live alongside in repo-local docs. This is what does not change.

### Reading order
1. The **Sigma Ten** (§3) is the core. If you only internalise one section, internalise this.
2. The **Security Baseline** (§4), **Resilience Patterns** (§5), and **Supply Chain Integrity** (§6) are non-negotiable for production.
3. The **Maturity Tiers** (§7) tell you what is required *when*. Prototypes are not held to the same bar as production — but the path from one to the other is explicit.
4. The **AI Agent Rules** (§8) bind any agent operating in our codebases.
5. The **Stack Appendices** translate the principles into concrete idioms for the language and platform you are using. Read the one(s) you need.

### Stack appendices
- **[JavaScript / TypeScript](./appendix-javascript-typescript.md)** — Deno, frontend web. *Dependency-minimal stance.*
- **[Go](./appendix-golang.md)** — services, tooling, CLIs.
- **[Android / Kotlin](./appendix-android-kotlin.md)** — mobile, host apps.
- **[Godot](./appendix-godot.md)** — game and interactive content.

### Cultural appendix
- **[Good Ideas](./appendix-good-ideas.md)** — annotated reading list. The influences behind this standard.

### Companion review playbooks
The standard says what "good" is; the **review playbooks** are how we check it — each a human guide with a paired AI prompt: [code review](../playbooks/code-review.md), [API design](../playbooks/api-design-review.md), [database](../playbooks/database-review.md), [web security](../playbooks/web-security.md), [web performance](../playbooks/web-performance.md), [frontend accessibility](../playbooks/frontend-accessibility-review.md), [GitHub Actions](../playbooks/github-actions-review.md), [repo setup](../playbooks/repo-setup-review.md), [web SRE](../playbooks/web-sre.md), [documentation](../playbooks/documentation-review.md), and [incident postmortems](../playbooks/incident-postmortem.md).

---

## 1. First Principles

These are the *why* behind the rules.

1. **Simplicity is a feature.** Complexity is borrowed against future debugging time, at a high interest rate. Default to boring.
2. **Make the invariants visible.** A property that must hold should be expressed in types, assertions, or tests — not in a comment, not in a developer's head.
3. **Failures are events, not exceptions.** Every system fails. Designed-in failure handling beats discovered-in-production failure handling by orders of magnitude in cost (the classic "rule of 10": catching a bug in design is ~$1, in production ~$1000).
4. **What you cannot observe, you cannot operate.** Logs, metrics, and traces are first-class deliverables, not afterthoughts.
5. **Trust nothing across a boundary.** User input, network responses, third-party libraries, env vars, the file system, even your own past self in a prior process — all untrusted by default.
6. **Small blast radius.** When something does fail, the failure should be contained — by scope, by process boundary, by resource pool, by feature flag.
7. **Reversibility wins.** Prefer deployments, schemas, and APIs that can be rolled back. Irreversibility is expensive.
8. **Minimise dependencies.** Every external dependency is borrowed risk — code you didn't write, a supply chain you don't fully audit, upgrade churn, attack surface. Add deliberately; prune proactively. The stack appendices set the bar; the JS/TS appendix in particular sets a strict one.

---

## 2. Lineage

For context, this standard distils and adapts:

- **[NASA/JPL Power of 10](https://spinroot.com/gerard/pdf/P10.pdf)** (Holzmann, 2006) — the structural backbone, adapted for managed runtimes.
- **[SEI CERT Secure Coding Standards](https://cmu-sei.github.io/secure-coding-standards/)** — language-specific security and reliability rules.
- **[NIST SSDF (SP 800-218)](https://csrc.nist.gov/pubs/sp/800/218/final)** — organisational and lifecycle controls.
- **[SLSA](https://slsa.dev/)** — build and supply-chain integrity.
- **OWASP [ASVS](https://owasp.org/www-project-application-security-verification-standard/) / [Top 10](https://owasp.org/www-project-top-ten/)** — application security baseline.
- **[Twelve-Factor App](https://12factor.net/)** — operational hygiene for services.
- **[Release It!](https://pragprog.com/titles/mnee2/release-it-second-edition/)** (Nygard) — stability patterns (circuit breaker, bulkhead, etc.).
- Language-native canon: [Effective Go](https://go.dev/doc/effective_go), [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html), [TypeScript strict mode](https://www.typescriptlang.org/tsconfig/#strict), [GDScript style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html).

You do not need to read all of these. You need to internalise what follows.

---

## 3. The Sigma Ten

Our adaptation of the Power of 10 for managed-runtime, modern-stack software. These are language-agnostic. The appendices show what each rule looks like in your stack.

### 1. Simple control flow
No clever tricks. Prefer iteration over recursion; if recursion is genuinely the cleanest expression, bound it explicitly and document the bound. Cyclomatic complexity per function ≤ 10. Early returns over nested conditionals. No use of language exception/jump mechanisms as control flow.

### 2. Bounded everything
Every loop, queue, retry, request, batch, and resource has an explicit upper bound. No unbounded work in any execution path — not in a request handler, not in a worker, not in a script. If the bound depends on input, validate the input against a maximum before processing.

### 3. Bounded resource lifecycles
Acquired resources — handles, sockets, locks, concurrent tasks, DB connections, subscriptions, observers, audio/graphics contexts — have guaranteed cleanup. Use the language primitive that makes it impossible to forget. No fire-and-forget concurrent tasks without a cancellation path.

### 4. Small, single-purpose units
Functions ≤ 60 lines, files ≤ 500 lines, modules/packages with one stated responsibility. If you can't describe what a unit does in a single sentence without "and", split it. Long parameter lists (>4) → use options structs / builders / named-argument idioms.

### 5. Defensive at every boundary
Validate every input at every trust boundary: HTTP handlers, IPC, file parses, queue consumers, IPC/intent inputs, env vars, command-line args. Check every error return — every one. Encode invariants in the type system where possible, runtime assertions/preconditions otherwise. Aim for ≥2 explicit checks per non-trivial function (parameter validation + post-condition or invariant assertion).

### 6. Smallest possible scope
Variables, functions, modules, services at the smallest scope that works. No package-level / module-level mutable state. Prefer immutability — use the language's strongest immutability primitive by default. Globals are a code smell; singletons are a global wearing a hat.

### 7. Type safety strictly enforced
Static type checking is mandatory in any language that supports it, in the strictest mode the language offers. Type-system escape hatches (untyped casts, unchecked nulls, untyped reflection) require an inline justification and a tracked ticket. Encode domain invariants in the type system whenever the cost is reasonable. Stack-specific manifestations live in the appendices.

### 8. No silent failures
Every error is handled, transformed into a domain error, or explicitly propagated. No empty catches. No unhandled async failures. No discarded error returns. Panics / exceptions / unchecked errors only escape at trust boundaries (HTTP edge, top-level worker, main) where they get structured logging and a fallback response. Errors carry context; use the language's error-wrapping primitive.

### 9. Observable by default
Every service exports:
- **Structured logs** (JSON, with severity, timestamp, correlation ID, service, version)
- **Traces** via OpenTelemetry — span every external call (DB, HTTP, queue, FS for large ops)
- **Metrics** — at minimum: request count, error count, latency histogram (p50/p95/p99), and any domain-critical counter
- **Health and readiness endpoints** for any long-running process

Every request and async job carries a correlation ID, propagated downstream. Logs never contain secrets, PII, or payment data — define and enforce a redaction layer.

### 10. Zero-warning, zero-drift policy
Linters, type-checkers, static analysers, and dependency audits are green in CI on every PR. Suppressions require an inline comment with a justification and, for non-trivial cases, a tracked ticket. Compiler/tool warnings are build failures. Dependencies do not silently drift — lockfiles or equivalent are committed and CI fails on mismatch.

---

## 4. Security Baseline

These are non-negotiable for any code shipped to a user or to production infrastructure. Language-specific tooling is in the appendices; the frontend trust boundary and the review procedure are in the [web-security](../playbooks/web-security.md) playbook.

### Secrets
- **Never** in source, never in client-side bundles, never in logs, never in error messages, never in URLs.
- Secrets live in a dedicated secret manager (AWS Secrets Manager, GitHub Actions encrypted secrets, equivalent). Local dev uses an ignored env file plus a documented example file.
- Rotate on any suspected exposure. Treat a committed secret as compromised even if force-pushed away.

### Authentication & authorisation
- All authentication is server-side. Clients present credentials; they do not decide whether a user is authenticated.
- Authorisation checks happen at every protected endpoint, not just at the gateway. Defence in depth.
- Default deny. Allow lists, not deny lists.
- Sessions: short-lived tokens, secure transport, rotation on refresh.

### Input handling
- Validate, then sanitise, then process. Validation rejects; sanitisation transforms; both happen before logic.
- Parameterised queries always — no string-concatenated SQL.
- Output encoding context-aware (HTML, JS, URL, attribute). Let your framework do this *and* verify it does.
- File uploads: type-sniffed (don't trust extension or MIME), size-bounded, stored outside any served directory, scanned if user-uploaded.

### Transport & storage
- TLS 1.2 minimum, TLS 1.3 preferred. HSTS on web.
- Encrypt sensitive data at rest. Use authenticated encryption (AES-GCM, ChaCha20-Poly1305) — never raw AES-CBC.
- Hash passwords with Argon2id (preferred) or scrypt/bcrypt. Never MD5, SHA-1, or unsalted SHA-2.

### Logging & telemetry hygiene
- A defined redaction list (passwords, tokens, PANs, full PII) enforced in the logging layer, not at call sites.
- Crash and error reporters configured to scrub the same.
- Logs go somewhere durable, queryable, and access-controlled.

---

## 5. Resilience Patterns

Every external dependency — every HTTP call, DB query, queue read, file read — is a potential failure. Apply the patterns proportional to criticality. For release readiness, post-release verification, and incident diagnosis, see the [web-sre](../playbooks/web-sre.md) playbook.

### The core five
1. **Timeout** — every I/O has an explicit, finite timeout. There is no "wait forever". Propagate cancellation from the request edge down to the leaf I/O.
2. **Retry with exponential backoff and jitter** — only for *transient* errors (network blips, 5xx, lock contention). Never for 4xx. Cap total attempts (typically 3–5) and total elapsed time. Always jitter.
3. **Circuit breaker** — after N consecutive failures (or failure-rate threshold), open the circuit; fail fast for a cooldown period; half-open to test recovery. Prevents retry storms from compounding the downstream's problem.
4. **Bulkhead** — partition resources (thread pools, connection pools, concurrent-task semaphores) per dependency, so one slow dependency doesn't drain the resources another needs.
5. **Graceful degradation / fallback** — define what "reduced service" looks like for each failure mode. A cached response. A static fallback. An empty list with a banner. A queued retry. Never a 500 to the user if a degraded response is possible and correct.

### Cross-cutting
- **Idempotency** — any operation that mutates state and may be retried (across the network, across a queue redelivery) must be idempotent or guarded by an idempotency key. Mandatory for payment, scheduling, notification, and any external integration. See the [api-design-review](../playbooks/api-design-review.md) playbook for contract-level idempotency (idempotency keys, conditional requests, `412`/`428`).
- **Backpressure** — bounded queues with rejection policies. Never let a producer outrun the consumer without a defined drop or block strategy.
- **Health vs readiness** — distinguish "process is alive" (health, used by orchestrator to restart) from "process can serve traffic" (readiness, used by load balancer to route).
- **Graceful shutdown** — handle termination signals. Stop accepting new work, drain in-flight work to a timeout, then exit.

### Anti-patterns
- Aggressive retries without jitter or concurrency limits → retry storm
- Retries on idempotent-unsafe operations without idempotency keys → duplicated mutations
- Timeouts that exceed the upstream's timeout → resource exhaustion before fail
- Catching all errors and continuing → silent data loss

---

## 6. Supply Chain Integrity

Adapted from SLSA + NIST SSDF. Apply at least Level 2 equivalence for production systems. The review procedures live in the [github-actions-review](../playbooks/github-actions-review.md) and [repo-setup-review](../playbooks/repo-setup-review.md) playbooks.

### Source
- Branch protection on `main`: no direct pushes, required reviews, required status checks. ("Required reviews" assumes a multi-person repo — a solo maintainer cannot approve their own PR, so set the approval count accordingly; see [repo-setup-review](../playbooks/repo-setup-review.md).)
- Signed commits required for release branches.
- `.gitignore` covers env files (except documented examples), credentials, key material, build outputs.
- Secret scanning runs in CI on every PR and rejects on hit.

### Dependencies
- Lockfiles or pinned versions committed.
- No floating versions for production code (`latest`, `*`, broad ranges without lockfile enforcement).
- Automated dependency updates with grouped, tested PRs.
- Vulnerability scanning in CI; critical and high vulnerabilities block merge to `main`.
- A vetted, minimal allow-list for any dependency in security-sensitive code (auth, crypto, payments).
- *See the stack appendices for the dependency philosophy and tooling per ecosystem — the JS/TS appendix sets a strict bar.*

### Build
- Reproducible-as-possible builds: pinned base images, pinned tool versions, hermetic where feasible.
- CI workflow steps pin third-party actions by full SHA, not by tag.
- Build provenance generated for production artifacts (SLSA provenance, or at minimum a build manifest with commit SHA, builder identity, dependencies).
- Artifacts signed and verified at deploy.

### Runtime
- Container images scanned and rebuilt regularly to pull patched base layers.
- SBOM generated for every release artifact (CycloneDX or SPDX).
- Runtime secrets injected by the platform, never baked into images.

---

## 7. Maturity Tiers

Not every line of code needs production-grade rigour from day one — but the path from sketch to production must be explicit and gated.

### Tier 0 — Prototype / Spike
**Purpose:** learn, demonstrate, validate. May not survive the week.

- The Ten apply in spirit, not letter.
- Required: zero secrets in code, basic input validation at trust boundaries, no destructive operations against shared state.
- Linter and type-check green is still required — these are cheap.
- Not required: full test suite, observability, resilience patterns, SBOM.
- **Lives in a clearly-marked branch, folder, or repo.** A prototype must never accidentally become production.

### Tier 1 — Beta / Internal
**Purpose:** real users, real data, but tolerant audience; ownership clear.

- The Ten apply fully.
- Required: security baseline (§4) in full, structured logging, error reporting, basic metrics, automated tests for critical paths (≥60% coverage on business logic), CI with linting + tests + dependency audit. For user-facing UI: WCAG 2.2 AA on critical flows (see [frontend-accessibility-review](../playbooks/frontend-accessibility-review.md)).
- Required-light: resilience patterns where failure is plausible (timeouts always; retry/breaker where downstreams flake).
- Not yet required: SLSA Level 2, full SBOM, chaos testing.

### Tier 2 — Production
**Purpose:** real users with no tolerance for failure; SLOs declared.

- Everything in this document applies in full.
- Required additionally: SLOs and error budgets defined; runbook exists; on-call rotation; incident process; staged rollout (canary or blue/green); rollback tested at least quarterly; SBOM generated per release; signed artifacts; chaos tests for critical failure modes; full WCAG 2.2 AA with automated accessibility checks in CI for user-facing UI.
- Promotion to Tier 2 requires a documented review against this standard.

### The promotion rule
> Code does not "drift" upward. A prototype is promoted to beta by a deliberate review and remediation pass. A beta is promoted to production the same way. The review checks every section of this document and the relevant stack appendix, then produces a gap list. Gaps are closed before promotion, not after.

---

## 8. AI Agent Rules of Engagement

These rules apply to Claude Code, Claude in Chrome, and any other AI agent operating in Sigma repositories.

### Agents must
1. **Read this standard and the relevant stack appendix** before non-trivial work in any Sigma repo. The repo's `AGENTS.md` or `CLAUDE.md` references both.
2. **Identify the tier** (§7) of the code being modified — by folder, by branch, or by asking — and apply the appropriate bar.
3. **Match or exceed the surrounding code's standard.** If a function has type annotations, your additions have type annotations. If the file uses `Result`-style errors, you don't introduce thrown exceptions.
4. **Surface deviations explicitly.** If a request would violate this standard (e.g. "add a recursive function with no bound", "swallow this error"), say so, propose the standard-compliant version, and proceed only with explicit operator confirmation.
5. **Prefer existing primitives.** If the codebase has a validator, an error type, a logger, a retry helper — use it. Do not introduce a parallel implementation.
6. **Respect the dependency stance.** Before adding any dependency, check the relevant stack appendix's criteria. In the JS/TS appendix, the default is to *not* add one. Surface the addition explicitly with justification — never sneak it in.
7. **Always write tests for new logic at Tier 1+.** Even if the operator did not ask. Mention it; do not skip silently.
8. **Never commit secrets** or what could plausibly be one. If a secret is needed for a task, stop and ask.
9. **Treat `// TODO`, `// FIXME`, `// HACK` (and equivalents) as load-bearing.** Don't remove them without resolving the underlying issue.

### Agents must not
- Disable lint, type, or test checks to make a build pass. Fix the underlying issue.
- Auto-update dependencies as a side effect of unrelated work.
- Refactor outside the scope of the task without saying so first.
- Ship destructive operations (file deletion, schema changes, force pushes) without explicit operator confirmation in the chat for the specific operation. Generic prior approval does not count.
- Use type-system escape hatches without an inline comment justifying it. (See appendices for the per-stack list.)
- Bypass §4 (security baseline) — ever, in any tier.

### Prototype mode
When an operator explicitly says "this is a prototype / spike / quick sketch / sandbox":
- §3 applies in spirit, §4 still applies fully (no secrets, basic validation), §5–6 may be deferred.
- The agent should note: "Marking this as Tier 0. Promoting to beta/production will require a review pass against the Sigma Engineering Standards."

---

## 9. Enforcement & Tooling

What lives in CI is what is real. Aspirations in a document are not enforcement. The matrix below is by *category* — specific tools per stack are in the appendices.

| Category | Required from | Notes |
|---|---|---|
| Lint / format | Tier 0 | Prefer language-native tooling over add-ons |
| Type / static analysis | Tier 0 | Strictest mode the language offers |
| Tests (unit + critical-path integration) | Tier 1 | Race / concurrency tests where applicable |
| Secret scanning | Tier 0 | Rejecting on hit |
| Dependency audit | Tier 1 | Vulnerability + licence |
| SAST | Tier 1 | Language-appropriate scanner |
| Container / artifact scan | Tier 2 | If shipping containers/binaries |
| SBOM | Tier 2 | CycloneDX or SPDX |
| Build provenance | Tier 2 | SLSA-aligned |
| Telemetry (logs/metrics/traces) | Tier 1 | OpenTelemetry preferred |

### Living document
This standard is versioned. Changes go through PR review with at least two engineers. The version is referenced in repo-level `AGENTS.md` / `CLAUDE.md` so agents and humans can verify they are reading the current edition.

---

## Appendix — Quick Reference Card

Print this. Stick it on the wall.

```
THE SIGMA TEN
 1. Simple control flow
 2. Bounded everything
 3. Bounded resource lifecycles
 4. Small, single-purpose units
 5. Defensive at every boundary
 6. Smallest possible scope
 7. Type safety strictly enforced
 8. No silent failures
 9. Observable by default
10. Zero-warning, zero-drift

NON-NEGOTIABLE AT ALL TIERS
 - No secrets in source
 - Validated input at every boundary
 - TLS in transit, hashed/encrypted at rest
 - No destructive ops without explicit confirmation
 - Dependencies added intentionally, never sneaked in

PRODUCTION ADDS
 - Timeout, retry+jitter, breaker, bulkhead
 - Idempotency on mutations
 - SLOs, runbook, rollback tested
 - Signed artifacts, SBOM, provenance
 - WCAG 2.2 AA on user-facing UI
```

---

*Sigma Engineering Standards — v1.3*
*Stack appendices: [JS/TS](./appendix-javascript-typescript.md) · [Go](./appendix-golang.md) · [Android/Kotlin](./appendix-android-kotlin.md) · [Godot](./appendix-godot.md)*
*Cultural appendix: [Good Ideas](./appendix-good-ideas.md)*
