# Appendix — Godot

*Stack appendix for the [Sigma Engineering Standards](./sigma-engineering-standards.md). Covers Godot 4.x projects in GDScript. We don't currently use C# in Godot, so it's out of scope here. Game and interactive content have failure modes that differ from services — corrupted saves, vanished assets, frame-rate cliffs — so this appendix leans into those. This is developer best practice first — how a Sigma engineer writes idiomatic GDScript by hand. It is also the bar an AI agent writing GDScript in our repos is held to: match these idioms, and surface any deviation (see [§8 of the standard, AI Agent Rules of Engagement](./sigma-engineering-standards.md#8-ai-agent-rules-of-engagement)).*

---

## 1. Tooling Baseline

Required for every Godot repo:

- **`gdformat`** (gdtoolkit) — formatting. No diff allowed.
- **`gdlint`** — static analysis. Zero warnings.
- **GDScript static typing** enabled, with strict warnings (see §2).
- **`gdscript-toolkit` in CI** along with project loading via `--headless --check-only` to catch parse errors.
- **Editor warnings as errors** for release exports — set in Project Settings → Debug → GDScript → Warnings to `Error` on the categories listed in §2.
- **Unit tests** via **GUT** (Godot Unit Test) for logic; integration scenes for behaviour.
- **Reproducible export presets** committed to the repo (see §10).

---

## 2. GDScript Conventions

GDScript 4 is a typed language *if you ask it to be*. We ask.

### Typing — non-negotiable
- **Every variable, parameter, and return value annotated.** `func attack(target: Enemy) -> int:` not `func attack(target):`.
- **`:=`** is fine for inferred locals where the right-hand-side makes the type obvious. Explicit annotations elsewhere.
- **`Variant`** is the GDScript equivalent of `any` — avoid in domain code; restrict to interop with built-in APIs that genuinely return Variant.
- **Strict warnings enabled:** `UNTYPED_DECLARATION`, `UNSAFE_PROPERTY_ACCESS`, `UNSAFE_METHOD_ACCESS`, `UNSAFE_CAST`, `UNSAFE_CALL_ARGUMENT`, `RETURN_VALUE_DISCARDED`, `INTEGER_DIVISION` — all set to *Error*. (We deliberately do **not** raise `INFERRED_DECLARATION` to error — `:=` for obviously-typed locals is allowed per the Style rules below, and `UNTYPED_DECLARATION` already catches the genuinely untyped case.)

### Style
- **Names:** `snake_case` for variables, functions, signals; `PascalCase` for classes (`class_name`); `SCREAMING_SNAKE` for constants.
- **`class_name`** for any script that defines a reusable type. This gives autocomplete and type-checking in editor.
- **`@onready var foo := %FooNode`** with `Unique Names in Owner` (`%`) — not deep `$Path/To/Node` strings, which break on refactor.
- **Preload over load** for assets known at script-load time. `const SCENE := preload("res://...")`.
- **`@export`** every value designers should tune in the editor; **`@export_range`**, `@export_file`, `@export_enum` with constraints — these are validation as well as ergonomics.

```gdscript
class_name PlayerController extends CharacterBody2D

@export_range(50.0, 500.0, 1.0, "or_greater") var max_speed: float = 200.0
@export var jump_height: float = 64.0

@onready var _sprite: AnimatedSprite2D = %Sprite
@onready var _hitbox: Area2D = %Hitbox

const FOOTSTEP := preload("res://sfx/footstep.ogg")

signal died(reason: StringName)
```

---

## 3. Scene & Node Architecture

Godot's strength is composition. Use it.

- **Composition over inheritance.** A "player that can swim" is a `Player` with a `Swimmer` child component, not a `SwimmingPlayer` subclass.
- **Scenes are the unit of reuse.** Each meaningful behaviour lives in its own scene with a clear root, predictable child structure, and `class_name`.
- **One responsibility per scene.** If a scene's script is >300 lines (intentionally stricter than the main standard's 500-line file bar — scene scripts sprawl fast) or its node tree has multiple unrelated subsystems, split it.
- **Public API of a scene is its signals and exported properties.** Don't reach into children from outside — emit signals up, configure via exports down.
- **No `get_parent().get_parent().some_method()`.** Connect a signal or use a service locator (an autoload, with §6's caveats).
- **Groups (`add_to_group(...)`)** for "all enemies", "all interactables" — use sparingly and document the contract for each group name.

---

## 4. Resource & Signal Lifecycle

This is where Godot bugs live. Internalise these.

### Freeing nodes
- **`queue_free()`** for nodes — always. Never `free()` directly on a node that may be in the scene tree or referenced this frame.
- **`is_instance_valid(node)`** before touching a possibly-freed reference.
- **`WeakRef`** for long-lived references to nodes you don't own.

### Signal hygiene
- **Connect explicitly** in code or via the editor — be consistent within a project.
- **`CONNECT_ONE_SHOT`** for signals that should fire once (timer-based reveals, achievements).
- **Disconnect on cleanup** when a signal is connected to a node that may outlive the emitter. The framework cleans up child-to-parent connections automatically; cross-tree connections do not.
- **No business logic in `_process` if a signal can express it.** Event-driven > frame-driven.

### RefCounted / Resource
- `RefCounted` subclasses (the default for `extends RefCounted` or no extends) auto-manage. `Resource` is a `RefCounted` — cached by default, shared between consumers; if you need a fresh copy, `.duplicate()`.
- **Be aware of shared Resource state.** Two scenes referencing the same `.tres` see the same instance unless duplicated. This is a feature; it bites if forgotten.

### Lifecycle callbacks
- `_enter_tree` — first available to the tree; for setup that needs parent context.
- `_ready` — children are ready, scene is composed; default place for initialisation.
- `_exit_tree` — cleanup, disconnect cross-tree signals, stop timers you own.
- `_process(delta)` / `_physics_process(delta)` — frame and physics ticks. Keep them small. If a node doesn't need a tick, `set_process(false)` / `set_physics_process(false)`.

---

## 5. Async / `await`

GDScript 4's `await` is convenient and also a footgun.

- **Every `await` has a defined wake-up condition.** A signal, a `Timer`, or `get_tree().create_timer(...).timeout`.
- **Bound it.** For awaits that *could* hang (network, file IO, user input), use a `Timer` race or check `is_inside_tree()` after the wake-up — the node may have been freed.
- **Don't `await` in `_process` / `_physics_process`** — these are tick callbacks, not coroutines. Spawn a separate task.
- **Re-validate state after `await`.** The world may have changed: nodes freed, scene unloaded, player respawned.

```gdscript
func play_intro() -> void:
    _ui.fade_in()
    await _ui.fade_complete
    if not is_inside_tree(): return     # scene may have ended
    _voiceover.play()
    var timer := get_tree().create_timer(5.0)
    await timer.timeout
    if not is_inside_tree(): return
    _start_gameplay()
```

---

## 6. Autoloads (Singletons) — Sparingly

Autoloads are global state. They are sometimes the right answer (an audio bus manager, a save service, an analytics hub). They are usually the wrong answer.

- **Document every autoload** in a `docs/autoloads.md` with its responsibility and rationale.
- **Autoloads expose signals, not setters.** A global `EventBus` autoload that other scenes connect to is far cleaner than ten scenes calling into mutable state.
- **No business-logic state in autoloads.** Configuration, services, and event routing only.
- **Reset on scene reload** if the autoload holds session-scoped state.

---

## 7. Save State & Persistence

For Nanisca and any project where progress matters to a real user, save state robustness is a feature.

### Hard requirements
1. **Atomic writes.** Write to `user://save.tmp`, then `DirAccess.rename_absolute` to `user://save.dat`. Never write directly to the live file.
2. **Schema versioning.** Every save begins with `{"version": 3, ...}`. The loader migrates older versions or rejects with a clear UI message.
3. **Validation on load.** Type-check every field. Out-of-range, missing, or unknown fields → fall through to defaults, log, never crash.
4. **Corruption recovery.** Keep a rolling backup (`save.dat`, `save.bak`). On load failure, try the backup before the user sees an error.
5. **Encrypted only if there's a real reason.** Save tampering is rarely a real threat for educational/single-player apps. Plain JSON or `ConfigFile` is fine, easier to debug, easier to support.
6. **Never store secrets in saves.** Authentication tokens belong in the OS keychain, not in the save file.

```gdscript
const SAVE_PATH := "user://progress.json"
const BACKUP_PATH := "user://progress.bak.json"
const SAVE_VERSION := 3

func save(state: Dictionary) -> Error:
    var data := {"version": SAVE_VERSION, "state": state}
    var tmp := SAVE_PATH + ".tmp"
    var f := FileAccess.open(tmp, FileAccess.WRITE)
    if f == null:
        return FileAccess.get_open_error()
    f.store_string(JSON.stringify(data))
    f.close()
    if FileAccess.file_exists(SAVE_PATH):
        DirAccess.rename_absolute(SAVE_PATH, BACKUP_PATH)
    return DirAccess.rename_absolute(tmp, SAVE_PATH)
```

---

## 8. Asset Loading & Failure Modes

Games crash when assets vanish. We don't crash.

- **Preload critical assets** at scene-load time so missing assets fail loudly during development.
- **Lazy load** large, optional assets (cinematics, level data) with explicit failure handling.
- **`ResourceLoader.load_threaded_request(...)`** for assets that would block the main thread. Show a loading state in the UI.
- **Missing asset → soft fail.** A placeholder texture, a silent audio clip, a logged error — never a crash dialog in front of a user (especially a child).
- **`.import` files** for every asset committed. Import settings are part of the source of truth.

```gdscript
func load_level(path: String) -> PackedScene:
    if not ResourceLoader.exists(path):
        push_error("missing level: %s" % path)
        return preload("res://levels/fallback.tscn")
    var res := ResourceLoader.load(path) as PackedScene
    if res == null:
        push_error("could not load level: %s" % path)
        return preload("res://levels/fallback.tscn")
    return res
```

---

## 9. Performance Budget

Games have hard real-time constraints — 60 FPS = 16.6ms per frame. We budget proactively.

- **Profile early.** `Monitor` and the built-in profiler are free; use them when behaviour is new, not just when something feels slow.
- **`_process` is expensive at scale.** A hundred nodes each running `_process` adds up. Pool, batch, or event-drive.
- **`set_process(false)` / `set_physics_process(false)`** when a node doesn't need ticking.
- **Object pooling** for spawned-and-despawned entities (bullets, particles, enemies). Don't allocate per frame.
- **Texture atlases and `MultiMesh`** for many similar instances.
- **Audio bus configuration** committed; avoid `AudioStreamPlayer` per shot at high rates — use a pool.
- **Target device budget** is the *low-end* device, not the dev machine. For Nanisca: tablet-grade hardware, not desktop GPU.

---

## 10. Build & Export

- **Export presets** (`export_presets.cfg`) committed to the repo. Per-target presets named clearly (`android-prod`, `android-staging`, etc.).
- **Signing keys** never in the repo. CI injects them from the secret manager. **(Android)**
- **Version code and version name** managed through a single source — a `version.cfg` or build script — not edited per preset.
- **Debug code excluded** from release builds (see §11).
- **`.import/`** committed for deterministic imports.
- **Reproducible builds** — same source + same Godot version → same export hash. Pin the Godot version (`.godot-version` or similar).

---

## 11. Debug vs Production

Code that is fine in the editor will embarrass us in production.

- **`OS.is_debug_build()`** guards anywhere you have a debug overlay, cheat keys, or verbose logging.
- **Asserts (`assert(cond)`)** are stripped from release builds — they're for catching bugs in dev, not for runtime safety. *Use `push_error` and a soft-fail path for runtime checks that matter in release.*
- **`print` / `print_debug`** wrapped in a project logger that respects `OS.is_debug_build()`.
- **Editor-only addons** declared as such in `plugin.cfg`.
- **No `print(...)` of user data or secrets** — even in dev, this leaks into crash reports.

---

## 12. Game-Specific Resilience

Some patterns are specific enough to gaming that they don't fit the [main standard §5](./sigma-engineering-standards.md#5-resilience-patterns).

- **Frame-rate independence.** Use `delta` everywhere. Code that assumes 60 FPS will be wrong on a Steam Deck running at 40.
- **Pause-aware logic.** Decide per-node whether `process_mode` is `INHERIT`, `PAUSABLE`, `WHEN_PAUSED`, or `ALWAYS`. UI, audio fades, and reminders often need `ALWAYS`.
- **Input rate limiting.** Children mash buttons. Debounce or rate-limit destructive actions.
- **Battery awareness.** On mobile (Nanisca), reduce `Engine.max_fps` when backgrounded or idle. Stop `_process` on offscreen nodes.
- **Crash telemetry**, opt-in and PII-stripped, captures the last 100 log lines and a scene-tree snapshot. Helps reproduce what we won't see in the QA lab.
- **Network is optional.** For offline-first apps, the game must be fully functional without a network. Network calls are explicitly tried-and-soft-failed, never blocking gameplay.

---

## 13. Dependencies (Asset Library / Addons)

Godot's asset library is the equivalent of npm. Apply the same discipline.

- **Vetted, narrow, active.** Same bar as [main standard §6](./sigma-engineering-standards.md#6-supply-chain-integrity).
- **Vendored** into `addons/` rather than fetched at build time. The version is what's in the repo.
- **Read the source** of every addon at least once. They run with full project permissions.
- **Default: zero.** The engine does a great deal on its own. Reach for an addon only when justified.

---

## 14. Anti-Pattern Quick List

- Untyped GDScript in any non-prototype project.
- `get_node("/root/...")` with deep absolute paths in code.
- `free()` on a Node (use `queue_free()`).
- Modifying a Resource you got from `preload` without `.duplicate()` when you needed an instance.
- Business logic in `_process` that could be signal-driven.
- Storing references to freed nodes (always `is_instance_valid` first).
- Saving directly to the live file without an atomic rename.
- Crashing on a missing asset.
- Cheat keys, debug overlays, or `print`s shipped to release.
- Network calls without a soft-failure path in an offline-first app.

---

## 15. The Checklist (PR-time)

- [ ] `gdformat`, `gdlint`, headless project check, GUT tests all green
- [ ] All new GDScript is fully typed; strict warnings still pass as errors
- [ ] Signals disconnected on cleanup; no leaked timers
- [ ] No `free()` on nodes; `is_instance_valid` before touching long-held refs
- [ ] Save format unchanged *or* version bumped + migration written + tested
- [ ] Missing-asset path tested for any new asset reference
- [ ] No `print` / debug overlays / cheat keys in code paths that ship to release
- [ ] `set_process(false)` on nodes that don't need it
- [ ] Profiled on target-tier device for any change in a hot path
- [ ] No new addon, *or* justified in PR description against §13

---

## References

Authoritative references for the Godot stack:

- [Godot documentation](https://docs.godotengine.org/en/stable/).
- [GDScript style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html).
- [Godot best practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/index.html).

---

*Sigma Godot Appendix — v1.2 · pairs with [main standard](./sigma-engineering-standards.md) v1.3*
