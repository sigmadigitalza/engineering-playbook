# Appendix — Go

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers services, CLIs, and tooling written in Go.*

---

## 1. Tooling Baseline

Required in CI for every Go repo:

- `go vet ./...`
- `gofmt -l` (no diff) / `goimports`
- `golangci-lint run` with a curated rule set including `errcheck`, `gosec`, `revive`, `staticcheck`, `gocyclo`, `nilness`, `bodyclose`, `noctx`
- `staticcheck ./...`
- `govulncheck ./...`
- `go test -race -cover ./...`

Go modules ≥ the project's declared `go` version. `go.sum` committed and verified.

---

## 2. Context Propagation

`context.Context` is non-negotiable for any function that does I/O, blocks, or could be cancelled.

- **First parameter, named `ctx`.** Always.
- **Never `nil`.** Use `context.TODO()` if you genuinely don't have one (and treat it as a TODO).
- **Never stored in a struct.** Pass it through. (Long-lived services may hold a "lifetime" context for their own goroutines — document the exception.)
- **Every blocking operation respects it.** DB queries (`db.QueryContext`), HTTP requests (`http.NewRequestWithContext`), channel ops (`select { case <-ctx.Done(): ... }`).
- **`defer cancel()` always** when you create a context with cancel/deadline/timeout — even if the deadline will fire on its own.
- **Don't smuggle business data through `context.Value`.** Reserve it for request-scoped metadata (correlation ID, auth principal, locale). Use typed keys.

```go
func GetUser(ctx context.Context, id UserID) (User, error) {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()
    
    var u User
    err := db.QueryRowContext(ctx, "SELECT ... FROM users WHERE id=$1", id).Scan(&u.Name, &u.Email)
    if err != nil {
        return User{}, fmt.Errorf("get user %s: %w", id, err)
    }
    return u, nil
}
```

---

## 3. Error Handling

- **Every error is checked.** `_ = err` requires a comment.
- **Wrap with `%w`** to preserve the chain: `fmt.Errorf("doing X: %w", err)`.
- **Match with `errors.Is` / `errors.As`**, never string comparison.
- **Sentinel errors** for stable API contracts (`var ErrNotFound = errors.New("not found")`). **Typed errors** when callers need structured data (`type ValidationError struct { Field, Reason string }` implementing `error`).
- **No `panic` outside `init` or genuinely unrecoverable states.** A panic in a request handler is a bug. Recover at the top of each goroutine that you spawn, log it as a crash, and return.
- **One log per error, at the top level.** Wrapping with context as you bubble up is enough — don't log at every layer.

```go
// Stable API error
var ErrUserNotFound = errors.New("user not found")

// At the boundary
user, err := svc.GetUser(ctx, id)
switch {
case errors.Is(err, ErrUserNotFound):
    http.Error(w, "not found", http.StatusNotFound)
    return
case err != nil:
    logger.ErrorContext(ctx, "get user failed", "err", err, "id", id)
    http.Error(w, "internal error", http.StatusInternalServerError)
    return
}
```

---

## 4. Concurrency

- **Every goroutine has a defined exit condition** tied to a context, a closed channel, or a `sync.WaitGroup`. Fire-and-forget goroutines are a leak waiting to happen.
- **`go test -race` in CI.** Always.
- **Prefer `errgroup.Group`** (`golang.org/x/sync/errgroup`) over hand-rolled `WaitGroup` + error channel for grouped goroutines.
- **Bounded concurrency** via a semaphore channel or `errgroup.SetLimit`. Unbounded fan-out is a denial-of-service waiting to happen.
- **Bounded channels.** Unbuffered or sized — never let "buffer = arbitrary large number" be the answer to backpressure.
- **No `sync.Mutex` embedded in exported types** unless the locking discipline is part of the documented API. Prefer narrow internal locks.
- **Don't share by communicating *and* communicate by sharing.** Pick one per concern.

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8) // bounded concurrency

for _, item := range items {
    g.Go(func() error {
        return process(ctx, item)
    })
}
if err := g.Wait(); err != nil {
    return fmt.Errorf("process batch: %w", err)
}
```

---

## 5. HTTP Servers

Never use the zero-value `http.Server` in production. All four timeouts set:

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           h,
    ReadHeaderTimeout: 5 * time.Second,   // mandatory — Slowloris defence
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      30 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20,
    BaseContext:       func(net.Listener) context.Context { return rootCtx },
}
```

Graceful shutdown:

```go
go func() {
    <-rootCtx.Done()
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
    defer cancel()
    _ = srv.Shutdown(shutdownCtx)
}()
if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
    logger.Error("server", "err", err)
    os.Exit(1)
}
```

---

## 6. HTTP Clients

- **Never use `http.DefaultClient`** in production code — it has no timeout.
- **One configured `*http.Client` per integration**, with timeout, transport settings, and connection pool sized for the workload.
- **`http.NewRequestWithContext`** always — never `http.NewRequest`.
- **`defer resp.Body.Close()`** after every successful response — and read to EOF (or use `io.Discard`) so the connection can be reused.

```go
var apiClient = &http.Client{
    Timeout: 10 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
    },
}
```

For retry / circuit-breaking, prefer a small handwritten wrapper around `*http.Client` over a heavy dependency. The patterns in the main standard §5 are 30–50 lines of Go.

### When a framework is warranted

For services with non-trivial routing, middleware composition, or many handlers, **Labstack Echo** (`github.com/labstack/echo/v4`) is the team default. It's minimalist, middleware-clean, and doesn't fight stdlib idioms — Echo wraps `http.Server`, so the timeout discipline above is unchanged.

```go
e := echo.New()
e.HideBanner = true
e.Use(middleware.RequestID())
e.Use(middleware.Recover())
e.Use(middleware.Logger())   // replace with slog-based middleware in production

e.GET("/users/:id", getUser)

srv := &http.Server{
    Addr:              ":8080",
    Handler:           e,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      30 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20,
}
if err := e.StartServer(srv); err != nil && !errors.Is(err, http.ErrServerClosed) {
    logger.Error("server", "err", err)
    os.Exit(1)
}
```

**Echo conventions:**
- Always thread `c.Request().Context()` into downstream calls — Echo does not magic this for you.
- Prefer Echo's binding (`c.Bind(&dto)`) for shape, but follow with explicit domain validation (see appendix §5 for the validation pattern). Never trust `c.Bind` alone for trust-boundary checks.
- Group routes with `e.Group("/api/v1", auth)` for shared middleware.
- Errors: return `echo.NewHTTPError(...)` for expected status responses; let unexpected errors hit a centralised `e.HTTPErrorHandler` that logs and renders a generic 500.
- Echo's default `Logger` middleware is fine for dev; in production, write a thin middleware that emits structured JSON via `slog` with the request's correlation ID.

---

## 7. Types & Interfaces

- **No `any` / `interface{}` in domain types.** Use concrete types or narrow interfaces defined at the *consumer*, not the producer.
- **Accept interfaces, return structs.** Standard Go advice; we hold to it.
- **Tag struct fields explicitly** for JSON/DB. `json:"-"` for fields that must never leave the process (passwords, tokens).
- **Validate on construction.** A constructor that returns `(T, error)` is preferable to a struct that can exist in an invalid state.

---

## 8. Dependencies

Go's standard library is unusually rich; lean on it.

- **Default to stdlib** for HTTP, crypto, JSON, SQL, templating, encoding, sync primitives, OS interaction.
- **`golang.org/x/...`** is a near-extension of stdlib — `errgroup`, `semaphore`, `sync/singleflight` are routine additions.
- **External dependencies** allowed when they pass the bar in main standard §6: narrow, mature, active, justified.
- **No deep import paths** to internal packages of dependencies. If a library forces this, it's a smell.
- **`go.mod` minimal-version-selection** is a feature — don't fight it. Pin exact versions of security-sensitive deps via `replace` if needed.

Common acceptable additions: `github.com/labstack/echo/v4` (the team-default web framework when one is needed — see §5), `github.com/jackc/pgx`, `github.com/golang-migrate/migrate`, `github.com/google/uuid`, OpenTelemetry SDKs, `golang.org/x/sync`, `golang.org/x/oauth2`. Anything beyond, justify.

---

## 9. Testing

- **Table-driven tests** by default — see `examples_test.go` in stdlib for the canonical pattern.
- **Subtests** with `t.Run("descriptive_case", ...)` so failures are precise.
- **`t.Parallel()`** for independent tests.
- **`testing/synctest`** (experimental in Go 1.24, graduated to stable in 1.25) for deterministic concurrency testing.
- **`httptest.Server`** for HTTP integration; **`testcontainers`** for DB integration where containers are warranted.
- **Coverage** ≥ 60% on business-logic packages at Tier 1.
- **Don't mock what you don't own** — wrap external services in your own interface, mock the interface, and integration-test the wrapper separately.

---

## 10. Observability

- **`log/slog`** (Go ≥ 1.21) for structured logging. Pass `ctx` so request-scoped attributes propagate.
- **OpenTelemetry SDK** for traces and metrics. Span every outbound call.
- **`pprof`** endpoints behind auth in production; on by default in dev.
- **`expvar`** or a Prometheus-compatible exporter for operational counters.

---

## 11. Anti-Pattern Quick List

- `_ = someFunc()` discarding an error — never (without a comment).
- `panic` in a library — never; return an error.
- Spawning a goroutine inside a request handler that outlives the request without explicit ownership — never.
- `time.Sleep` in production code paths — almost never; you want `time.After` in a `select` with `ctx.Done()`.
- `http.DefaultClient` / `http.DefaultServeMux` in production — never.
- `string(buf)` -> `[]byte(s)` -> `string(buf)` round-trips in hot paths — costly; use `bytes.Buffer` or `strings.Builder`.
- Embedded `sync.Mutex` in exported types without documented locking discipline.
- `context.Background()` deep inside a call stack — almost always wrong; thread the caller's `ctx` instead.

---

## 12. The Checklist (PR-time)

- [ ] `go vet`, `gofmt`, `golangci-lint`, `staticcheck`, `govulncheck`, `go test -race` all green
- [ ] Every new exported function has a doc comment
- [ ] Every new error path tested
- [ ] No new dependency, *or* justified in PR description against §8
- [ ] No `any`, no swallowed errors, no fire-and-forget goroutines
- [ ] HTTP servers/clients have timeouts; contexts threaded
- [ ] No secrets in code; configuration via env validated at boot

---

*Sigma Go Appendix — v1.2 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
