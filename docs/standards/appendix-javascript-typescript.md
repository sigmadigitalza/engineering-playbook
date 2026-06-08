# Appendix — JavaScript / TypeScript

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers Deno services, frontend web, and any TypeScript codebase. The driving stance: **dependency-minimal, platform-native first.** This is developer best practice first — how a Sigma engineer writes idiomatic TypeScript by hand. It is also the bar an AI agent writing TypeScript in our repos is held to: match these idioms, and surface any deviation (see §8 of the standard, AI Agent Rules of Engagement).*

---

## 1. The Dependency Philosophy

This is the section most likely to be argued with. We hold the line anyway.

> **Every dependency is borrowed risk.** Code we didn't write. A supply chain we don't fully audit. A patch treadmill. An attack surface. A versioning headache. A vector for `npm install` to ship a backdoor.

So:

- **Default: zero.** A new module starts with no dependencies. Adding one is a deliberate act, surfaced in the PR description with a justification.
- **Platform-native first.** Web standard APIs and the runtime standard library have, over the last decade, absorbed most of what we used to npm-install. Use them.
- **A dependency is justified only if all of these hold:**
  1. The problem is genuinely hard (cryptography, parsing a complex format, OS-level integration, accessibility-critical UI affordances).
  2. A handwritten solution would exceed roughly 100 lines of non-trivial code, *or* would replicate work the dependency does to a standard we can't match (e.g. RFC compliance).
  3. The dependency is narrow-scope, mature, actively maintained, and small in transitive footprint.
  4. We have read the source (at least the entry points) at least once.
- **Anti-defaults** — these are presumed to *not* be needed unless strongly justified: frontend frameworks, state-management libraries, ORMs, validation libraries, date libraries, lodash-style utility kits, bundlers for small apps, CSS-in-JS, polyfills for currently-supported features.
- **Pruning is a chore on the calendar.** Quarterly: remove anything we no longer truly need.

The rest of this appendix shows how this works in practice.

---

## 2. Runtime Preference

**Deno is the default** for new services, scripts, and tooling. The reasons:

- Built-in `lint`, `fmt`, `test`, `check`, `bench`, `doc`, `compile`, `bundle` — no dev-dependency sprawl for tooling.
- Web-standard APIs first-class: `fetch`, `Request`, `Response`, `URL`, `URLPattern`, `Headers`, `crypto.subtle`, `Web Streams`, `AbortController`, `Intl`. Code is portable to browsers and edge runtimes.
- Explicit permissions (`--allow-net`, `--allow-read`, `--allow-env`) — least privilege is default behaviour.
- URL imports + JSR remove the "install 800 transitive packages" problem.

**Node is acceptable** where ecosystem dependencies force it (Android tooling, a legacy npm-only library we genuinely need) — and the Node built-ins now cover most of what we used to install: `node:http`, `node:fs`, `node:crypto`, `node:test`, `node:assert`, `node:stream`, `node:worker_threads`, native `fetch`, `URL`, `AbortController`. Use a current LTS, the permission model (`--permission`, stable since Node 23.5; `--experimental-permission` on older LTS) where supported, and prefer `node:*` modules over npm equivalents wherever feasible.[^node]

**The browser is its own runtime.** Treat it as such — see §8.

[^node]: Node built-ins make the dependency-minimal stance achievable on Node too, and existing Node codebases should lean into them rather than rewriting to Deno wholesale. The directional preference, though, is toward Deno for new work — ergonomics, web-standard alignment, and the built-in toolchain compound over time. Treat Node as a fine present and Deno as the future for new services.

---

## 3. Tooling — Use the Built-ins

| Concern | Default | Add-on only if |
|---|---|---|
| Lint | `deno lint` | Specific rule the built-in doesn't cover; then minimal ESLint with flat config |
| Format | `deno fmt` | Repo style cannot be expressed in `deno fmt` config (rare) |
| Type-check | `deno check` / `tsc --noEmit` | Never replace; sometimes augment with project-specific compiler plugins |
| Test | `Deno.test` / `node:test` | UI testing requires a browser harness |
| Bench | `Deno.bench` | — |
| Bundle | `deno bundle` / native ESM in the browser | Multi-package monorepos where ESM-native won't scale |

Prettier, Jest, Vitest, ts-node, esbuild-loader, ts-jest, Babel — all candidates for *not* installed unless the project genuinely needs them. (Most don't.)

---

## 4. TypeScript Configuration

`deno.json` / `tsconfig.json` baseline for all TypeScript code:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

**Hard rules:**
- No `any` in domain code. Use `unknown` and narrow.
- No `// @ts-ignore`. `// @ts-expect-error` is acceptable *with* an inline comment and a ticket number.
- No non-null assertion `!` on values that come from outside the trust boundary (parsed JSON, query params, etc.). Narrow them instead.
- Type imports use `import type`. This keeps runtime imports honest and prevents accidental circular runtime deps.
- Prefer discriminated unions over class hierarchies.

---

## 5. Validation Without a Library

For most boundaries (HTTP body, query params, env vars, file parse), we don't need a schema library. A handwritten validator is ~30 lines, gives us exact control over error messages, and adds zero dependencies.

Pattern — a parsing function that returns a `Result`-shaped value and narrows the type:

```ts
type Ok<T>  = { ok: true;  value: T };
type Err    = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

const ok  = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = (error: string): Err => ({ ok: false, error });

type CreateUser = { email: string; age: number };

function parseCreateUser(input: unknown): Result<CreateUser> {
  if (typeof input !== "object" || input === null) return err("body must be an object");
  const o = input as Record<string, unknown>;

  if (typeof o.email !== "string") return err("email must be a string");
  if (!o.email.includes("@") || o.email.length > 254) return err("email invalid");

  if (typeof o.age !== "number" || !Number.isInteger(o.age)) return err("age must be an integer");
  if (o.age < 0 || o.age > 150) return err("age out of range");

  return ok({ email: o.email, age: o.age });
}
```

When the schema genuinely is complex (recursive types, JSON Schema compliance, OpenAPI generation), `zod` or `valibot` are acceptable — but treated as the one validation dependency for the project, not stacked alongside others.

For env vars: validate at boot, fail fast with a clear message, never `process.env.X!`.

---

## 6. Errors as Values

We prefer explicit `Result<T, E>` returns over thrown exceptions for *expected* failure paths (validation, business rule violations, expected I/O failures). Throw only for **programmer errors** — bugs, unreachable states, invariant violations.

```ts
// Expected failure → Result
async function chargeCard(id: string, amount: Cents): Promise<Result<Charge, PaymentError>> { ... }

// Programmer error → throw
function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}
```

At trust boundaries (HTTP handlers, top-level workers), have *one* try/catch that maps unexpected throws to structured 500s with a logged correlation ID. Below that boundary, code does not catch and continue.

**Never** ignore a promise. Top-level promise rejections crash the process; use `void` only with a comment and intentionally.

---

## 7. HTTP & Server (Deno)

Standard library + web APIs cover the 95% case. The `Deno.serve` API is enough for most services.

```ts
const router = new URLPattern({ pathname: "/users/:id" });

Deno.serve({ port: 8080 }, async (req) => {
  const url = new URL(req.url);
  const match = router.exec(url);
  if (!match) return new Response("not found", { status: 404 });

  const id = match.pathname.groups.id;
  // ... handler body
});
```

**Conventions:**
- Timeouts on every outbound `fetch` via `AbortSignal.timeout(ms)`.
- Bounded concurrency on any fan-out (see §11).
- Structured JSON logs to stdout. One log line per request at the boundary, including method, path, status, duration, correlation ID.
- Health endpoint at `/healthz`, readiness at `/readyz`, distinct semantics (see main standards §5).
- Graceful shutdown: listen for `SIGTERM`, stop accepting new connections, await in-flight, exit.

A small framework (Hono, Oak) is acceptable when the routing complexity passes the dependency criteria in §1. The default is `Deno.serve` + `URLPattern`.

---

## 8. Frontend Strategy — Vanilla First

The web platform of 2026 is not the web platform of 2016. Vanilla TypeScript + modern CSS + Web Components is genuinely competitive with framework-driven development for most of what we build.

### Defaults
- **Native ESM in the browser** — `<script type="module">`, import maps for bare specifiers. No bundler for small apps.
- **Web Components / Custom Elements** for reusable UI primitives. They are framework-agnostic and survive the next framework cycle.
- **Modern CSS** — variables (`--token`), `:has()`, container queries, cascade layers, `@scope`, native nesting. No CSS-in-JS, no Tailwind without an explicit reason.
- **Native form features** — `required`, `pattern`, `type=email`, `<input type=date>`. Layer JS validation on top, don't replace.
- **`fetch` + JSON** for data. No Axios.
- **State** — start with the URL (`URLSearchParams`, `History`), then `localStorage` / `IndexedDB`, then DOM events, then a handwritten observable if needed. We have not yet found a project that needed Redux/Zustand-class abstractions.

### When a framework is warranted
Genuine SPA with deep interactivity (an editor, a complex dashboard, a real-time collaborative tool). In that case prefer something small and standard-aligned: **Lit** for component-driven work, **Preact** if you specifically need React semantics. Justify in writing.

### Things we don't install by default
- React/Vue/Svelte (unless the framework decision is documented)
- Tailwind (modern CSS does what it did)
- Axios (use `fetch`)
- Moment / dayjs (use `Intl.DateTimeFormat` and, soon, `Temporal`)
- Lodash / Underscore (use built-in `Array`/`Object`/`Map`/`Set`)
- jQuery (yes, still — sometimes proposed)

---

## 9. Module & Import Strategy

- **Deno:** prefer JSR (`jsr:@scope/pkg`) > deno.land/std > npm specifier (`npm:...`) > URL import. Pin everything in `deno.json` `imports` (the import map) and commit `deno.lock`.
- **Node:** `pnpm` is acceptable when Node is required (smaller, content-addressed store, fewer hoisting surprises than npm). Pin exact versions for security-sensitive deps.
- **Browser:** import maps in HTML for shared specifiers. Versioned URLs for third-party scripts with SRI hashes.
- No `latest`, no broad `^` ranges in production manifests without lockfile enforcement.
- Renovate or Dependabot configured with grouped PRs, scheduled (not every push).

---

## 10. Testing

- `Deno.test` / `node:test`. No Jest, Mocha, or Vitest unless a project has genuine cause.
- Co-locate tests next to source (`foo.ts` + `foo.test.ts`) or in `tests/` for integration.
- Each test is independent — no shared mutable state, no order dependencies.
- Use `t.step()` / subtests for grouped assertions.
- **No mocks where a fake suffices.** Prefer hand-written fakes (a struct/object implementing the same interface) over mocking libraries.
- For HTTP, test against a real `Deno.serve` instance on an ephemeral port, not a mock.

Coverage target: 60% on business logic at Tier 1, with critical paths at higher. Coverage is a smoke detector, not the goal.

---

## 11. Concurrency Primitives

The platform gives us `Promise.all`, `Promise.allSettled`, `Promise.race`, `AbortController`, `AbortSignal.timeout`, `AsyncIterator`, `ReadableStream`, `TransformStream`. That covers most cases.

For bounded concurrency (the most-installed dependency in JS history — `p-limit` — is 30 lines), write it once:

```ts
export function limit(n: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (active >= n) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          active--;
          next();
        });
      });
      next();
    });
}

// usage
const run = limit(5);
const results = await Promise.all(urls.map((u) => run(() => fetch(u))));
```

For producer/consumer with backpressure: native streams (`ReadableStream` with a `BYOB` reader for chunked I/O; `TransformStream` for pipelines). For inter-task signalling: `AbortController` + `EventTarget`.

---

## 12. Observability

- Structured logs as JSON to stdout (one object per line). No `console.log` in production code; have a tiny logger module (~20 lines) that enforces shape and redaction.
- OpenTelemetry SDK for traces and metrics in services. The OTel JS SDK is one of the few "yes, take this dependency" cases for production services.
- One correlation ID per request, propagated via `traceparent` header outbound.

---

## 13. Anti-Pattern Quick List

- `eval`, `new Function`, `setTimeout("string")` — never.
- `==` — `===` always.
- `JSON.parse` on untrusted input without try/catch — never.
- `dangerouslySetInnerHTML` / `.innerHTML = userInput` — never.
- Catch-all `catch (e) {}` — never (always log or rethrow).
- `process.env.X!` — validate at boot.
- `await` inside a `forEach` — use a real loop or `Promise.all`.
- Mutating function parameters — copy, don't mutate.
- `Date` arithmetic across timezones — use `Intl` / `Temporal`.

---

## 14. The Checklist (PR-time)

Before opening a PR in a TS/JS project, the author confirms:

- [ ] `deno fmt && deno lint && deno check **/*.ts` (or Node equivalent) green
- [ ] Tests added/updated for changed logic
- [ ] No new dependencies — *or* the PR description justifies each against §1
- [ ] No `any`, no `// @ts-ignore`, no non-null assertions on untrusted values
- [ ] No new `console.log`; logging goes through the project logger
- [ ] No secrets in code, env-example updated if env shape changed
- [ ] Permissions in `deno.json` task remain minimal

---

*Sigma JS/TS Appendix — v1.2 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
