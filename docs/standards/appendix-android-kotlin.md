# Appendix — Android / Kotlin

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers Android applications and Kotlin code targeting the Android runtime. Most rules also apply to JVM-only Kotlin; sections marked **(Android)** are platform-specific. This is developer best practice first — how a Sigma engineer writes idiomatic Kotlin by hand. It is also the bar an AI agent writing Kotlin in our repos is held to: match these idioms, and surface any deviation (see §8 of the standard, AI Agent Rules of Engagement).*

---

## 1. Tooling Baseline

Required in CI for every Android/Kotlin repo:

- **ktlint** — formatting and basic style. No diff allowed.
- **detekt** — static analysis with our shared ruleset (`detekt.yml` in the org config repo). Threshold: zero issues at `error` severity.
- **Android Lint** with `lintOptions { abortOnError true }` for release variants. **(Android)**
- **Kotlin compiler warnings as errors** — `allWarningsAsErrors = true`.
- **Unit tests** — JUnit5 + MockK *only when a hand-written fake won't do*.
- **Instrumented / Compose tests** — Espresso, `compose-ui-test` for screens that justify them.
- **Dependency audit** — `gradle dependencyCheck` (OWASP) or equivalent; vulnerability gate at `high`.
- **R8 / ProGuard** rules reviewed; release builds tested in their minified form. **(Android)**

`gradle.lockfile` committed for reproducible builds.

---

## 2. Kotlin Language Conventions

- **`val` over `var`** by default. `var` requires a reason.
- **No `!!` outside platform-type boundaries** (Java/C interop). When it does appear, an inline comment justifies it.
- **No `lateinit`** in domain types — prefer constructor injection. `lateinit` is acceptable for Android-injected fields (Activities/Fragments where the framework owns construction). **(Android)**
- **`requireNotNull` / `checkNotNull` / `require` / `check`** at trust boundaries — these are our defensive assertions and they produce clear failures.
- **Sealed classes / interfaces** for closed sets of states. `when` over them is exhaustive — compiler-checked.
- **Data classes** for value types. Avoid `equals`/`hashCode` by hand.
- **Inline value classes** for IDs and unit-typed primitives (`UserId(value: Long)`) — these are free at runtime and prevent the "wrong-id" bug.
- **No reflection** in security-sensitive paths or hot paths.
- **No `Any?` in domain APIs.** Use sealed hierarchies or specific generics.

---

## 3. Structured Concurrency (Coroutines)

Coroutines are mandatory for asynchronous work. Callbacks are legacy; convert when touching adjacent code.

**Hard rules:**

- **Every coroutine has a defined `CoroutineScope`** tied to a lifecycle: `viewModelScope`, `lifecycleScope`, or a custom scope with an explicit `Job` and cancellation point. **(Android)**
- **`GlobalScope` is forbidden** in application code. (Library code may justify it, with a tracked review.)
- **Honour cancellation.** Don't catch `CancellationException` without rethrowing. `try { ... } catch (e: Exception) { }` swallows cancellation — use specific exceptions or `catch (e: CancellationException) { throw e }` first.
- **Dispatchers explicit.** `withContext(Dispatchers.IO)` for blocking I/O; `Dispatchers.Default` for CPU; `Dispatchers.Main` only for UI. Inject `CoroutineDispatcher` into classes that do work so tests can substitute `UnconfinedTestDispatcher`.
- **`withTimeout(...)`** or `withTimeoutOrNull(...)` on any operation that can hang.
- **Flow** for streams of values. `StateFlow` for current UI state; `SharedFlow` for one-shot events (configure replay/buffer explicitly).
- **No `runBlocking`** outside `main()` and tests. Ever.

```kotlin
class UserViewModel(
    private val repo: UserRepository,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) : ViewModel() {

    private val _state = MutableStateFlow<UserState>(UserState.Loading)
    val state: StateFlow<UserState> = _state.asStateFlow()

    fun load(id: UserId) {
        viewModelScope.launch {
            _state.value = withContext(io) {
                withTimeout(5.seconds) {
                    when (val r = repo.get(id)) {
                        is Result.Ok  -> UserState.Loaded(r.value)
                        is Result.Err -> UserState.Error(r.error)
                    }
                }
            }
        }
    }
}
```

---

## 4. Errors as Values

For business logic, prefer a sealed `Result`-style type over thrown exceptions. Throws are reserved for genuinely exceptional conditions (programming errors, unrecoverable framework callbacks).

```kotlin
sealed interface Outcome<out T, out E> {
    data class Ok<T>(val value: T): Outcome<T, Nothing>
    data class Err<E>(val error: E): Outcome<Nothing, E>
}

sealed interface UserError {
    data object NotFound : UserError
    data class Network(val cause: Throwable) : UserError
    data class Validation(val field: String, val reason: String) : UserError
}
```

(Kotlin's own `kotlin.Result` is fine for simple cases but its `Throwable` constraint is often the wrong shape for domain errors.)

At UI boundaries, map errors to displayable states. Never let a coroutine crash propagate to the UI without being caught and transformed.

---

## 5. State Management & Architecture

- **MVVM or MVI**, not MVP, not raw Activities/Fragments doing work.
- **Single source of truth** per state — a `StateFlow` in a ViewModel or a Store.
- **UI state hoisted** out of composables (Jetpack Compose) or out of Views — composables/views are presentational.
- **`Configuration changes`** survive: state in ViewModels, not in Views. **(Android)**
- **Navigation** via Jetpack Navigation Compose or equivalent — typed routes preferred. **(Android)**
- **No business logic in `Activity` / `Fragment` / `Composable`.** They orchestrate; they do not compute.

---

## 6. Background Work (Android)

- **`WorkManager`** for deferrable, guaranteed-to-execute work (sync, uploads, periodic tasks).
- **`Service` / `Foreground Service`** only when the user-visible activity model demands it (audio, navigation, fitness). Foreground service types declared in the manifest with the appropriate permission.
- **Never raw threads or `AsyncTask`.** Coroutines for in-process; WorkManager for cross-process.
- **JobScheduler / AlarmManager** only for exact alarms with clear justification (calendar, medical reminders).

---

## 7. Security (Android)

### Manifest hygiene
- `android:exported` declared explicitly on every component (required from API 31+).
- No exported `Activity`/`Service`/`Receiver` without an authentication or signature-level permission.
- `android:allowBackup="false"` *or* explicit `android:fullBackupContent` rules excluding sensitive directories.
- `android:usesCleartextTraffic="false"` for production; HTTP only via explicit Network Security Config exemption in dev builds.

### Network Security Config
- TLS pinning for production builds (release-only NSC).
- Cleartext blocked in production.
- Trust anchors limited to system CAs — no user-added CAs in release variants.

### Secrets & data at rest
- **Small secrets:** `EncryptedSharedPreferences` (the `androidx.security:security-crypto` library) was **deprecated in April 2025** — migrate off it. Use **Tink** for encryption (with a key held in the Keystore) and **DataStore** for persistence; don't reach for ESP in new code.
- **`Keystore`** (hardware-backed where available) for crypto keys.
- **Room with SQLCipher** when a local DB holds sensitive data.
- Never log full tokens, PII, or payment data. Wrap `Logger` to enforce redaction.

### Intent handling
- **Validate every extra** read from an intent. Trust nothing. Even your own app can be called by another caller via implicit intent if you forget to lock it down.
- **Explicit intents** for in-app navigation; **implicit intents** only when calling out, with `Intent.ACTION_*` and a chooser.
- **App Links** verified via Digital Asset Links for deep linking.
- **Pending intents** must specify `FLAG_IMMUTABLE` (or `FLAG_MUTABLE` with documented reason).

### Other
- Disable backups for sensitive data via `dataExtractionRules` (API 31+).
- WebView: `setJavaScriptEnabled` only if needed, `setAllowFileAccess(false)`, `setAllowContentAccess(false)`, never `addJavascriptInterface` with untrusted content.
- Don't expose `ContentProvider` without permission.
- Tap-jacking: `filterTouchesWhenObscured` for sensitive actions (auth, payment).

---

## 8. Dependencies

Android force-feeds a baseline (AndroidX, Jetpack, Compose, Kotlin stdlib). Beyond that:

- **AndroidX libraries** preferred over equivalents from Google's legacy support library or third parties.
- **Coroutines, Flow, Serialization** as default async / data tooling.
- **Network** — OkHttp + Retrofit + KotlinX Serialization is the standard stack. Ktor on JVM-only / multiplatform.
- **DI** — Hilt for Android. Manual constructor injection acceptable for small modules and library code.
- **Image loading** — Coil (Kotlin-first, coroutines-native) preferred over Glide.
- **Database** — Room. Avoid raw SQLite outside Room unless justified.
- Anything else, follow main standard §6 criteria.

Lockfile (`gradle.lockfile`) committed. Renovate / Dependabot configured.

---

## 9. Build & Variants

- **Build variants** declared in `build.gradle(.kts)` per flavour (dev / staging / prod / per-client). Each has its own `applicationIdSuffix`, signing config, network config, and obfuscation rules.
- **Signing keys** never in the repo. Stored in the secret manager; injected by CI.
- **Release builds tested** — including the minified, obfuscated form. R8 rules adjusted with care; don't `-keep class **` to silence a problem.
- **Crash reporters** (Firebase Crashlytics or equivalent) wired up with redaction.
- **Version code monotonically increases.** Version name follows SemVer or a documented scheme.

---

## 10. Testing

- **Unit tests** for ViewModels, repositories, and pure-Kotlin logic — `kotlinx-coroutines-test` for time control.
- **Hand-written fakes** by default (e.g. `FakeUserRepository`). MockK / Mockito only when a fake is genuinely impractical.
- **Instrumented tests** for what only the device can verify (DB schema, file I/O, hardware integrations).
- **Compose tests** for screens with non-trivial state.
- **Screenshot tests** for visually-stable components (Paparazzi / Roborazzi).
- **LeakCanary** in debug builds — leak detection is part of CI's smoke tests for any non-trivial change. **(Android)**

---

## 11. Anti-Pattern Quick List

- `GlobalScope.launch { ... }` anywhere in app code.
- `runBlocking` outside `main` / tests.
- `!!` on framework-returned values without explicit null-check upstream.
- Empty `catch (e: Exception) {}`.
- `Thread { }` / `AsyncTask` — both legacy.
- `findViewById` in new code — use View Binding or Compose.
- Subclassing `Application` for global mutable state.
- Storing references to `Context`/`Activity` in singletons or long-lived objects (leak risk).
- `SharedPreferences` for secrets — encrypt via Tink with a Keystore-held key (`EncryptedSharedPreferences` is deprecated as of April 2025).
- Exported components without `android:permission`.

---

## 12. The Checklist (PR-time)

- [ ] `ktlint`, `detekt`, Android Lint, `gradle test`, instrumented tests (where applicable) all green
- [ ] No new `!!`, `lateinit` (in domain), `GlobalScope`, or empty catches
- [ ] Coroutines scoped to a lifecycle; cancellation honoured
- [ ] Errors handled as values or transformed to UI states; no uncaught crashes from background work
- [ ] Manifest changes reviewed for `exported`, `permission`, deep links
- [ ] No secrets in code or resources
- [ ] R8 rules updated if APIs added that need keeping; release build verified
- [ ] No new dependency, *or* justified in PR description against §8

---

*Sigma Android/Kotlin Appendix — v1.1 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
