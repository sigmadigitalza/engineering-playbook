# API Design Review Playbook

A strategy and Claude Code prompt for reviewing REST and GraphQL API designs — covering resource modeling, HTTP semantics, error shape, idempotency, pagination, versioning, contract enforcement, and backwards-compatibility risk. Mode-routed for REST and GraphQL because they share goals but almost no concrete checks.

---

## Strategy

**API design is contract design.** Once a published endpoint has a consumer — mobile app, partner integration, third-party SDK, internal service mesh — the contract is harder to change than the implementation behind it. The review posture has to be: read the design as the consumer will, and assume any rough edge will be paved into a permanent footgun by the first integration that depends on it.

**Mode routing is unavoidable.** REST and GraphQL share goals — expose data, mutate state, enforce auth, evolve safely — but almost none of the concrete checks transfer. REST cares about URL shape, HTTP methods, status codes, header semantics. GraphQL cares about schema design, nullability, connections, field deprecation. A single rubric that hand-waves both produces shallow output for each. Mode 1 is REST; Mode 2 is GraphQL; if a system exposes both (mobile via GraphQL, partners via REST), run twice.

**REST as decoration vs. REST as design.** The classic anti-pattern is REST that's actually RPC over HTTP — `POST /users/createUser`, `POST /users/updateStatus`, every method behind POST, status codes ignored. The endpoints work, the SDK works, the docs look fine. But the design has none of the properties that make REST useful — caching, idempotency, intermediary handling, predictability. The prompt surfaces this as an architectural finding, not a nit.

**Status codes are the API's shape, not a vibe.** Returning `200 OK` with `{ "error": "...", "code": 42 }` in the body is a recurring pattern that breaks every retry policy, every cache, every monitoring tool that distinguishes 5xx from 2xx. Worth a top-severity finding when found at scale, because it becomes load-bearing fast and is then hard to fix without breaking every existing consumer.

**Errors should be machine-readable and consistent.** [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem details (`type`, `title`, `status`, `detail`, `instance`, plus extensions) is the modern recommendation. Accept legacy formats only when they are *consistent* across the API — inconsistency is worse than imperfection. Every error should also carry a correlation ID that maps to a server-side log entry; an error that doesn't is an error the support team can't help with.

**Idempotency is a contract, not an implementation detail.** PUT and DELETE are idempotent at the protocol level; POST mutations need an `Idempotency-Key` header (Stripe's pattern is canonical) and the server has to actually honor it — store the response, return it on retry, scope by consumer. An undocumented or unhonored `Idempotency-Key` is worse than not having one because consumers will think they have safe retry and they don't.

**Versioning is a strategy, not a URL prefix.** Plenty of APIs have `/v1/` and then break things inside it. The prompt grades the strategy — URL versioning, header versioning, GraphQL field deprecation, date-based versioning (Stripe). The right answer depends on the consumer mix; the wrong answer is "we have a version prefix but no policy."

**Pagination: cursor over offset for anything that grows or mutates.** Offset pagination on a stream of new records produces duplicates and skipped items as data changes underneath the cursor. Cursor-based (opaque cursor → next-cursor + has_more) is the safe default. GraphQL gets a sharper version of this in [Relay-style connections](https://relay.dev/graphql/connections.htm).

**GraphQL nullability is the schema's posture.** A schema where everything is nullable encodes "client must defensive-check every field" forever — every consumer becomes more defensive than the API requires, every refactor adds null checks. Make required fields non-null and accept the breakage cost up front. Nullable should mean "this can legitimately be missing," not "we haven't thought about it."

**GraphQL errors: typed errors via schema, not the errors array.** The top-level `errors` array is for protocol failures (auth, parse errors, server crashes). Business errors (validation failures, not-found, permission-denied) belong in the schema as union return types — `MutationPayload = SuccessShape | ValidationError | NotFoundError`. A GraphQL schema with no error types is a schema that has not been designed for failure; the prompt treats this as a Major finding, not a nit.

**Contract drift is the silent killer.** OpenAPI files written by hand always lie. SDL files that aren't snapshot-tested drift when resolvers change. The prompt always asks: where does the contract live, who generates whom, what enforces the link? If the answer is "we update the OpenAPI when we remember to," that is a finding.

**Two traps to encode:**

1. **"REST" as decoration.** The API has resource-shaped URLs and uses HTTP, but methods, status codes, and idempotency are RPC-flavored or absent. Surface as architectural — a redesign, not a nit.
2. **GraphQL "always returns 200" treated as a feature.** The GraphQL spec does specify 200 for valid responses including errors — but that only works as a transport ergonomic if errors are *modeled in the schema*. A GraphQL API where every business failure is a string in the `errors` array is undermining its own contract.

**Severity rubric:**

- **Breaking** — would break existing consumers if shipped as-is, or already-shipped behavior breaks consumers today.
- **Major** — significant DX, correctness, or evolvability issue. Will become load-bearing pain as adoption grows.
- **Minor** — inconsistency, naming smell, missing convenience.
- **Nit** — style.
- **Theatrical / RPC-in-disguise** — design choices presented as REST/GraphQL conventions that aren't. Severity is irrelevant; the finding is "this does not give you the property you think it gives you."

**Three-bucket reporting:**

- **A — Confirmed design issues.** Specific contract problems with evidence (file:line for code, method+path for REST, type+field for GraphQL).
- **B — Improvements & evolution recommendations.** Judgment calls, design-level suggestions, defense-in-depth.
- **C — Breaking-change risks.** Changes already in flight (this PR or recent commits) that will break consumers — schema changes, contract drift between SDL and resolvers, version-prefix violations.
- **Theatrical / RPC-in-disguise** called out separately within whichever section it appears.

---

## The Prompt

Paste into Claude Code, run from the repo root.

````markdown
You are a senior API designer with deep experience in REST and GraphQL contract design, evolution, and SDK ergonomics. You review API designs as the consumer will see them, with bias toward backwards compatibility and long-term evolvability over short-term cleverness. Cite specific files, lines, paths, operations, types, and fields for every finding.

# PRIME DIRECTIVES

- **The contract outlives the implementation.** Once an endpoint has a consumer, the contract is harder to change than the code behind it. Read the design as a third party would and assume rough edges become permanent.
- **Severity discipline.** Anchor every finding to: would this break consumers (Breaking), become load-bearing pain at scale (Major), produce minor friction (Minor), or be cosmetic (Nit)? Avoid grade inflation.
- **Cite specifics.** File paths and line numbers for code; method + path for REST endpoints; type + field for GraphQL; OpenAPI paths/operations; PR / commit SHAs. No generic advice.
- **Don't fabricate.** Don't invent endpoints, fields, RFCs, or consumer counts. If the contract or consumer surface is unclear, ask.
- **Consistency beats perfection.** A consistent imperfect convention is more valuable than a half-migrated good one. Surface inconsistency as a first-class finding.

# MODE SELECTION

Begin by asking which mode applies, then route to the matching Phase 2. If I've already told you, skip the question. If both apply, run Mode 1 first, then Mode 2.

- **Mode 1 — REST.** HTTP-based API exposing resource endpoints.
- **Mode 2 — GraphQL.** Schema-based API with a single endpoint, queries, mutations, optionally subscriptions.

Ask for the inputs that mode needs:
- Mode 1: target commit / branch / PR; OpenAPI / JSON Schema location if present; consumer mix (first-party SDK, mobile, partner, internal).
- Mode 2: target commit / branch / PR; SDL file location or introspection endpoint; whether persisted queries are in use; consumer mix.

# PHASE 1 — RECONNAISSANCE (all modes)

Do this before any analysis. Report briefly.

1. **API style detection.** REST, GraphQL, gRPC, JSON-RPC, mixed. Note framework — Express, Fastify, Hono, NestJS, Go net/http, Echo, Gin, FastAPI, Apollo Server, GraphQL Yoga, Mercurius, Hasura, PostGraphile, etc. This drives which conventions to expect.
2. **Contract artifacts.** Where does the contract live?
   - REST: OpenAPI / Swagger files (`openapi.yaml`, `swagger.json`), JSON Schema definitions, hand-written reference docs.
   - GraphQL: SDL files (`schema.graphql`), code-first schema definitions, generated SDL, introspection.
   - Generation direction: code-first (code → schema) vs schema-first (schema → code). Note any drift mechanism (snapshot tests, CI checks, conformance tests).
3. **Versioning strategy.** URL versioning (`/v1/`), header versioning (`Accept: application/vnd.x.v2+json`, `API-Version: 2024-04-10`), date-based (Stripe-style), GraphQL field deprecation, no versioning. Note what the policy actually is, not just what's in the URL.
4. **Auth model.** Bearer tokens, API keys, OAuth 2 / OIDC scopes, session cookies, mTLS, signed requests (AWS SigV4, HMAC). Where is auth enforced — gateway only, per-service, per-resolver? Are scopes documented per endpoint / field?
5. **Error response format.** Sample one error from each error class (validation, not-found, auth-failed, server-error). Is the shape consistent? Does it follow RFC 9457 (`type`, `title`, `status`, `detail`, `instance`)? GraphQL: are business errors in the `errors` array or in the schema as union types?
6. **Pagination, filtering, sorting conventions.** Cursor vs offset; query params or headers for filtering; sort syntax. GraphQL: Relay connections, custom pagination, no pagination.
7. **Idempotency posture.** Is `Idempotency-Key` documented? Honored? Scoped how (per-key, per-consumer)? GraphQL: are mutations explicitly named for idempotency intent (`createX` vs `upsertX`)? Is `clientMutationId` / similar accepted?
8. **Rate limiting & quota signals.** `X-RateLimit-*` or `RateLimit` (RFC 9728) headers, `Retry-After`, GraphQL query cost / depth / complexity limits. Documented? Returned consistently?
9. **Consumer inventory.** Who consumes this API? First-party SDK, mobile app, partner integrations, internal services, public developer portal. Blast radius of breaking changes scales with this.
10. **Existing style guide.** `docs/api-design.md`, `STYLE.md`, `API_GUIDELINES.md`, internal API guidelines. Read first — respect existing decisions until you have a reason not to.
11. **Contract test coverage.** Contract tests, schema snapshot tests, OpenAPI conformance checks, GraphQL schema diff in CI. Note presence and scope.
12. **What I'm missing.** End Phase 1 with gaps — missing OpenAPI, no SDL snapshot, unclear consumer mix, no versioning policy. State what changes if I provide each.

# PHASE 2 — REVIEW RUBRIC

Severity:
- **Breaking** — would break existing consumers if shipped, or already breaks consumers in production.
- **Major** — significant DX, correctness, or evolvability issue.
- **Minor** — inconsistency, smell, missing convenience.
- **Nit** — style.
- **Theatrical / RPC-in-disguise** — looks like a REST/GraphQL convention, doesn't give the property it claims.

Tag each finding: **CONFIRMED** (visible in the contract or code) / **RECOMMENDATION** (judgment, design-level) / **BREAKING-RISK** (would break consumers).

## Mode 1 — REST

### Resource modeling & URL design

- **Nouns, not verbs.** `/orders`, not `/getOrders` or `/createOrder`. Verbs hidden behind methods. Flag RPC-shaped URLs as Theatrical.
- **Hierarchy reflects ownership.** `/customers/{id}/invoices` when invoices are owned by a customer. Flat collections (`/invoices?customerId=...`) when ownership is loose.
- **Plural collections, singular items.** `/orders` and `/orders/{id}`. Mixed plural/singular is a Minor inconsistency that compounds over time.
- **No deep nesting.** More than two levels (`/a/{id}/b/{id}/c`) gets painful. Prefer flat with filter params past two.
- **IDs in paths, not bodies, for addressing.** `PATCH /orders/123` not `POST /orders { id: 123, action: "update" }`.
- **Stable, opaque IDs.** Not exposing sequential database IDs unless intentional. Public APIs leaking integer auto-increment IDs is a Minor finding (enumeration surface) at minimum.
- **Trailing slashes.** Pick one and enforce. Mismatched trailing-slash handling causes redirects that break some clients.
- **Casing.** Kebab-case in URLs (`/order-items`), snake_case or camelCase in JSON bodies — pick one and apply consistently.

### HTTP method semantics

- **GET is safe and idempotent.** No side effects. No state change. If a GET endpoint mutates anything, that's Breaking — caches, prefetchers, link-checkers will fire it.
- **POST creates or invokes.** Non-idempotent. Use `Idempotency-Key` if retries matter.
- **PUT replaces the whole resource.** Idempotent. Sending a partial body to a PUT is wrong; missing fields should be treated as null/unset by the server.
- **PATCH partially updates.** Idempotent if the patch format is well-defined ([RFC 7396 JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396) or [RFC 6902 JSON Patch](https://www.rfc-editor.org/rfc/rfc6902)).
- **DELETE removes.** Idempotent — deleting an already-deleted resource should return 204 or 404 consistently, not 500.
- **OPTIONS for CORS preflight and capability discovery. HEAD for cheap existence / metadata checks.**
- Flag any endpoint that mutates behind GET, or uses POST as a universal verb when PUT/PATCH/DELETE would be correct.

### Status codes

- **2xx for success.** 200 (with body), 201 (created, with `Location` header pointing to new resource), 202 (accepted, async), 204 (no content).
- **3xx for redirection.** Resource moves and content negotiation. Don't use for app-level routing.
- **4xx for client errors.** 400 (malformed), 401 (unauthenticated), 403 (authenticated but unauthorized), 404 (not found), 405 (method not allowed), 409 (conflict — versioning, duplicate), 410 (gone — explicitly removed), 422 (unprocessable entity — semantically wrong), 429 (rate limited).
- **5xx for server errors.** 500 (generic), 502 / 503 / 504 (gateway / availability).
- **One status code per case.** Don't return 200 with `{ "success": false }`. Breaks every retry policy and every monitoring tool. Treat as Breaking when found at scale.
- **401 vs 403.** 401 = "I don't know who you are"; 403 = "I know who you are, you can't do this." Mixing them is Minor but confuses SDKs.
- **422 vs 400.** 400 = malformed (can't parse), 422 = parsed but semantically invalid. Pick one and be consistent.

### Versioning

- **Have a strategy, document it.** No-versioning is acceptable for internal-only APIs that ship lockstep with consumers, not otherwise.
- **URL versioning** (`/v1/`) — simple, visible, but coarse. New version requires duplicating endpoints. Recommend only when major breaks are infrequent.
- **Header versioning** (`API-Version: 2024-04-10`) — finer-grained, less visible. Date-based versioning (Stripe-style) is the modern reference design for high-velocity public APIs.
- **Within a version, additive changes only.** Adding optional fields, new endpoints, new optional query params — fine. Removing fields, changing types, tightening enums, renaming — Breaking.
- **Deprecation signal.** `Deprecation` and `Sunset` headers (RFC 8594, draft-ietf-httpapi-deprecation-header) to communicate timelines.
- **Version sprawl.** v1, v2, v3, v4 all live with no sunset plan is a Major maintenance finding.

### Error responses

- **RFC 9457 problem details** is the modern recommendation: `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, plus extensions for app-specific data (per-field validation errors, error code).
- **Consistency.** Whatever the shape, every error from the API uses it. Mixed shapes are Major.
- **Correlation ID.** Every error response includes a request ID (`X-Request-Id`, `traceparent`, custom header) that maps to a server-side log entry. An error without this is unsupportable.
- **Error code stability.** If the API has its own error codes (`error: "INSUFFICIENT_FUNDS"`), they are part of the contract — renaming them is Breaking.
- **No leaking internals.** Stack traces, file paths, SQL fragments, internal service names in error bodies — top-severity finding for public APIs.
- **Validation errors.** Surface per-field detail (`{ "errors": [{ "field": "email", "code": "invalid_format" }] }`), not a single string.

### Idempotency & retry safety

- **GET, PUT, DELETE are idempotent at the protocol level.** PATCH usually is, depending on patch format. POST is not.
- **`Idempotency-Key` for mutating POST.** Documented, honored, scoped per consumer / API key. Server stores response keyed by (consumer, key) and returns the same response on retry within a TTL window. Stripe is the canonical reference.
- **Retry-safe error responses.** Errors the client can retry (5xx, 429) should be distinguishable from errors that won't change on retry (4xx). Document `Retry-After` for 429 and 503.
- **Long-running operations.** For operations exceeding a sensible HTTP timeout, return 202 with a status URL the client can poll. Don't make the client hold a 60s connection.

### Pagination, filtering, sorting

- **Cursor over offset for anything growing or mutating.** Offset pagination on a feed produces duplicates and skipped records as new items arrive. Cursor-based is the safe default.
- **Cursor opacity.** Cursors should be opaque (base64-encoded server state), not raw `offset=200`. Opacity gives the server room to change the underlying pagination later without breaking clients.
- **Page size.** Document the default, the max. Reject requests over max with 400, don't silently cap.
- **Filtering.** Query params for simple filters (`?status=active`). Request body for complex filters on POST search endpoints. Don't invent a query DSL in a query string.
- **Sorting.** `?sort=createdAt&order=desc` or `?sort=-createdAt`. Pick one. Document allowed sort fields — open-ended sort is a DoS surface.

### Auth, scopes, rate limiting

- **Auth scheme.** Bearer token, API key (header, never query string), OAuth 2 with PKCE, OIDC, mTLS. Document required headers per endpoint.
- **Scopes / permissions.** Per-endpoint scopes documented in OpenAPI / reference. The minimum scope to call an endpoint should be in the docs.
- **Rate limit headers.** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (or `RateLimit` per RFC 9728). `Retry-After` on 429.
- **Quota visibility.** Consumers need to introspect their own remaining quota — either via response headers on every call or a `/me/quota` endpoint.
- **Per-consumer rate limits.** Anonymous, per-API-key, per-user. Document the buckets.

### OpenAPI / JSON Schema contract

- **Single source of truth.** Either code generates the OpenAPI (preferred — drift is impossible), or the OpenAPI is checked against runtime behavior in CI. Hand-maintained OpenAPI is a Breaking-risk waiting to happen.
- **Coverage.** Every endpoint, every parameter, every response status, every error shape documented.
- **Examples.** Request and response examples for at least the happy path of each endpoint. Examples are how SDK generators learn.
- **Schema reuse.** Common types (`Money`, `Address`, `Timestamp`, `Pagination`, `Error`) defined once and referenced. Inline duplication is Minor.
- **`additionalProperties`.** Decide and apply consistently — `false` for strict requests (rejects unknown fields), permissive for responses (allows additive evolution).

### Backwards compatibility checklist

For any change in this PR (or recent commits), check:
- Field removed → Breaking.
- Field renamed → Breaking.
- Field type narrowed (`number` → `int`, `string` → `enum`) → Breaking.
- Required field added to request → Breaking.
- Optional field with no default added to response → Major (clients may not handle it).
- Enum value removed → Breaking.
- Enum value added → Minor for response (clients should ignore unknown), Major-or-Breaking for request (consumers don't know the value exists).
- Endpoint removed → Breaking unless deprecated with sunset window.
- Status code changed for an existing case → Breaking (clients branch on status).
- Error code renamed → Breaking.
- Default value changed → Breaking.
- Query param renamed → Breaking.
- Auth requirement tightened (scope added) → Breaking for current consumers without that scope.

### DX & SDK generation

- **Predictable shapes.** A `User` looks the same whether returned from `GET /users/{id}` or embedded in `GET /orders/{id}`.
- **Naming consistency.** `customer_id` vs `customerId` vs `customer.id` — pick one. Mixed is Major.
- **No hidden polymorphism.** A field that returns `string` sometimes and `object` other times breaks every typed SDK. Either union it explicitly in OpenAPI (`oneOf`) or pick one shape.
- **Datetime format.** RFC 3339 / ISO 8601 with timezone. Mixed formats are Major.
- **Money.** Minor units (cents) as integer + ISO 4217 currency code, never floats. Floats for money is a top-severity finding.

## Mode 2 — GraphQL

### Schema design & naming

- **Type names PascalCase, fields camelCase, enum values SCREAMING_SNAKE_CASE.** Inconsistency is Minor but compounds.
- **Use `ID` scalar for IDs.** Not `String`. Lets the server change ID encoding later without breaking clients.
- **Use custom scalars for semantic types.** `DateTime`, `URL`, `Email`, `Money`. `String` for a `DateTime` is a Major DX finding.
- **Naming consistency.** Pluralization (`users` vs `user`), boolean prefixes (`isActive`, `hasPermission`), input/output type pairing (`UserInput` / `User`).
- **Don't expose database schema as GraphQL schema.** GraphQL is a client-facing contract; if it mirrors the DB exactly, every DB refactor breaks the API. Surface as architectural.

### Nullability discipline

- **Required fields are non-null.** A field that is always present should be `String!`, not `String`. Nullable everywhere encodes "client must defensive-check forever."
- **Mutation payloads.** Generally non-null on success, with errors expressed as union types (see Errors below).
- **Nullable lists.** Be intentional. `[Item!]!` (non-null list, non-null items) is the common-case default for collections that are always returnable, even if empty.
- **Changing nullability is Breaking.** Non-null → nullable breaks consumers expecting the field to exist; nullable → non-null breaks consumers expecting null.

### Pagination — Relay connections

- **Use Relay connections** for collections that paginate: `edges`, `node`, `cursor`, `pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }`. Standard, tooled, predictable.
- **Cursor opacity.** Same as REST — opaque strings. Don't expose offsets.
- **Forward and backward.** Support `first`/`after` and `last`/`before` if relevant; document if only one direction is supported.
- **Custom pagination.** Acceptable if simpler patterns fit (small bounded collections), but document and apply consistently.

### Mutations

- **One mutation per intent.** `createOrder`, `cancelOrder`, `addItemToOrder`. Not a generic `updateOrder` that takes a giant input.
- **Input types.** Every mutation takes a single `input: CreateOrderInput!` argument, not loose positional args. Allows extension without breaking signatures.
- **Payload types.** Every mutation returns a payload type (`CreateOrderPayload`), not the entity directly. Payload contains the entity plus optional related data plus typed errors.
- **Idempotency.** If retries matter (payment, account creation), accept a `clientMutationId` or idempotency key in the input. Server deduplicates within a TTL window.
- **Don't nest mutations.** GraphQL doesn't guarantee ordering of nested mutations and most servers serialize them anyway. Two mutations in a single document is rare to actually need.

### Error model

- **Top-level `errors` array is for protocol errors.** Auth, parse errors, server crashes. Not business errors.
- **Business errors as schema types.** Use union types in mutation payloads: `CreateOrderPayload = OrderCreated | InsufficientStock | PaymentDeclined | ValidationError`. Clients handle each case in typed code.
- **Don't return strings.** "Validation failed: name is required" is unparseable; clients fall back to substring matching. Return structured error types.
- **GraphQL extensions for protocol errors.** When errors are unavoidable, use the `extensions` field with stable codes (`extensions.code = "UNAUTHENTICATED"`). Apollo and Relay clients depend on these.
- **Correlation ID.** Same as REST — every error response includes a trace / request ID, exposed in `extensions`.

### Field deprecation

- **`@deprecated(reason: "...")`** on fields and enum values. Never remove a field that has been live; deprecate it and let consumers migrate.
- **Deprecation hygiene.** A deprecated field with a clear `reason` and a replacement field is a working migration. A deprecated field with no replacement is a smell.
- **Removal policy.** If you do remove deprecated fields, document when and notify consumers via SDL diff in the changelog.

### Authorization

- **Per-field authorization, not just per-endpoint.** A query that returns `User { email, salary, ssn }` needs authorization at field level — not every viewer can see salary. Enforce at resolver level or via schema directives (`@auth(requires: ADMIN)`).
- **Don't return null for unauthorized.** Returning null silently for fields the viewer can't see hides authorization decisions and confuses clients. Return a typed error or omit the field via field-level filtering, but be consistent.
- **Introspection.** For public-facing APIs consider disabling in production to reduce surface mapping. Keep on for partner-facing APIs where the schema is the contract.

### Query cost, depth, rate limiting

- **Depth limits.** Reject queries deeper than N levels. Prevents trivial DoS via recursive selection.
- **Complexity / cost analysis.** Assign cost per field; reject queries above a threshold. Tools: graphql-cost-analysis, custom directives.
- **Per-consumer quotas.** Same as REST — document and return clearly.
- **Persisted queries.** For first-party clients, persisted queries (client sends a hash, server has the query stored) eliminate query-cost surprise. Recommend if the client surface is fixed.

### N+1 and resolver hygiene

- **DataLoader pattern.** Every batching opportunity wired through a per-request loader. A schema that triggers N+1 queries per nested field is a performance footgun worth flagging if visible.
- **Resolver complexity.** Resolvers should be thin — fetch data, defer to services. Complex business logic in resolvers makes the schema hard to evolve.

### SDL contract

- **Single source of truth.** Code-first or schema-first — pick one. Code-first frameworks (Pothos, TypeGraphQL, Nexus, gqlgen) generate SDL; schema-first (Apollo Server with SDL, GraphQL Yoga) generates code. Either works; mixing is Major.
- **Schema in CI.** Snapshot the SDL, diff it on every PR, surface breaking changes. Tools: GraphQL Inspector, graphql-cli, Apollo Rover. Without this, drift and silent breakage are guaranteed.
- **Federation.** If using Apollo Federation / Hive / Mesh, subgraph contracts are independently versioned — flag any subgraph change that shifts ownership of a type without coordinating.

### Backwards compatibility checklist

For any schema change in this PR (or recent commits), check:
- Field removed without deprecation → Breaking.
- Field nullability tightened (nullable → non-null) → Breaking for clients that handled null.
- Field type changed → Breaking.
- Required argument added to existing field → Breaking.
- Enum value removed → Breaking.
- Union member removed → Breaking.
- Interface added/removed from type → Breaking for fragment matching.
- Input field made required → Breaking.
- Deprecated field removed before reasonable migration window → Breaking, depending on consumers.
- Adding fields, optional arguments, new types, new enum values (response side) → Safe.

### DX & codegen

- **Codegen first.** First-party clients should use codegen (Apollo, Relay, graphql-code-generator, gqlgen). The schema's naming and shape decisions get baked into client code — they matter more than they look.
- **Naming consistency.** Same shapes across queries and mutations. Same field names across types (`createdAt`, not `created_at` in some types and `createdDate` in others).
- **No leaky abstractions.** Don't expose ORM types, internal flags, or migration columns. Each schema field is a public commitment.
- **Subscription discipline.** If subscriptions exist, document delivery guarantees (at-least-once, at-most-once), reconnection behavior, missed-message handling.

# PHASE 3 — REPORT

## Section A — Confirmed Design Issues

Numbered list. For each:
- Location (file + line, or method + path, or type + field).
- Tag: CONFIRMED.
- Severity (with one-line justification anchored to the rubric).
- Description.
- Evidence (snippet, schema fragment, OpenAPI excerpt).
- Recommended fix.

## Section B — Improvements & Evolution Recommendations

Design-level suggestions, judgment calls, missing defense-in-depth. For each:
- Location.
- Tag: RECOMMENDATION.
- Severity.
- Recommendation, with the why.
- Migration sketch if it touches existing consumers.

End with a ready-to-paste follow-up prompt to implement the Section B items I select.

## Section C — Breaking-Change Risks

Changes already in flight (this PR, recent commits) or already shipped that will break consumers. Use escalation language. For each:
- Location.
- Tag: BREAKING-RISK.
- What breaks, for whom.
- Recommended immediate action (revert, deprecate-then-remove, additive alternative).
- Migration plan if the breaking change is intentional.

End with a ready-to-paste follow-up prompt to address Section C.

## Theatrical / RPC-in-Disguise Findings

List separately. For each: where it appears, what convention it claims to follow, why it doesn't, what would actually give that property.

## Section D — Summary

- **Top 3 most important fixes**, in order.
- **Backwards-compatibility verdict**: Safe / Risky / Breaking — for any changes in scope.
- **Posture rating**: one-paragraph honest summary of the design's evolvability and DX. No grade inflation.
- **What I'd want for a deeper review** (consumer inventory, traffic data, SDK generation logs, partner feedback).

# PHASE 4 — IMPLEMENTATION

After the report, ASK what to do next. Do nothing automatically.

Possible drafts to offer (not execute):
- Specific patches for Section A items.
- An OpenAPI / SDL snippet showing the recommended shape.
- A `docs/api-design.md` style guide if missing.
- A CI check (schema diff, OpenAPI conformance, breaking-change linter) for the next PR.
- A deprecation plan (with sunset header values, changelog entry, consumer notification draft) for any Section C item being intentionally shipped.

# CONSTRAINTS

- Do not invent endpoints, fields, error codes, RFCs, or consumer counts. Cite what exists.
- Do not propose schema-wide refactors as a single change without a migration plan — for live APIs, breaking changes need a deprecation window.
- Do not treat presence of OpenAPI / SDL as proof of correctness — verify whether it's the source of truth or a hand-maintained doc.
- Do not treat REST URL shape as proof of REST design — check methods, status codes, and idempotency behind the URL.
- Do not treat GraphQL schema validity as proof of good GraphQL design — check nullability, error model, mutation patterns.
- Do not grade-inflate. If everything is Breaking, the rubric is broken — re-anchor.
- Respect existing API style guide decisions documented in the repo until you have a concrete reason not to.
- If credentials, tokens, or PII appear in any output (request/response examples, OpenAPI examples, SDL test fixtures), redact and flag.
````

---

## Notes on Using It

- Phase 1's contract artifact discovery is the most valuable single output — many APIs don't have a single source of truth for the contract, and the act of cataloguing what exists (and what's drifted) frequently surfaces the highest-impact finding before any actual review happens.
- Run Mode 1 and Mode 2 separately even if the system exposes both — the rubrics overlap so little that combined output ends up shallow on both sides. Worth two sessions and two reports.
- The "RPC-in-disguise" finding type produces the most useful conversations. Surfacing that the API has REST-shaped URLs but RPC behavior reframes the work — it's not a refactor of the URLs, it's a redesign of the contract, and that conversation is worth having early rather than after a breaking change is already shipped.
- For backwards-compatibility checks, point the prompt at a specific PR or commit range — `git diff main..HEAD -- 'openapi.yaml' 'schema.graphql' src/api/` produces the focused input the prompt does best with. Without scoping, breaking-change analysis becomes guesswork.
- The OpenAPI / SDL contract drift check is worth running standalone periodically — even disciplined teams accumulate drift over months. The prompt can be invoked just on Phase 1 step 2 ("verify the contract matches the implementation") for a quick health check.
- If the API is pre-launch (no consumers yet), be aggressive about Breaking findings — that's the cheapest moment to fix the contract. Post-launch, lean on Recommendation + deprecation paths.
- Pair with the [Web SRE playbook](web-sre.md) for live-system probing of headers, status codes, and rate-limit responses; this playbook focuses on design from the contract, not on probing the deployed surface.

---

## Reference Material

- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (subsumes RFC 7231)
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [RFC 7396 — JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396) · [RFC 6902 — JSON Patch](https://www.rfc-editor.org/rfc/rfc6902)
- [RFC 9728 — RateLimit Header Fields for HTTP](https://www.rfc-editor.org/rfc/rfc9728)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [JSON:API Specification](https://jsonapi.org/format/)
- [GraphQL Specification](https://spec.graphql.org/) · [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [Google API Design Guide (AIPs)](https://google.aip.dev/)
- [Stripe API Reference](https://stripe.com/docs/api) — canonical reference for date-based versioning, idempotency keys, error shape.
- [GitHub REST API Reference](https://docs.github.com/en/rest) · [GitHub GraphQL API Reference](https://docs.github.com/en/graphql) — large, evolved-over-time reference designs.
