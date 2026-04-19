# Bugbot Rules (octostar app)

Scope: `apps/octostar/`. For the heavily-reviewed Apps/ManifestEditor module, see `src/components/Apps/.cursor/BUGBOT.md`.

## EventEmitter3 Is the Core Bus — Don't Swap

`apps/octostar/src/interface.ts` imports `eventemitter3` with an explicit `// Don't change from EventEmitter3 without checking consequences` comment. Swapping to Node's `events` or an alternative changes sync-vs-microtask ordering the app relies on. (See `interface.ts:1`)

## Event Names Are Stringly-Typed — Typos Are Silent

Events like `WATCHERS_REFETCH_EVENT` are defined as string constants in `interface.ts`. New events must be declared there, not inlined as literals at emit/listen sites — a typo produces a listener that never fires and no error. (PR #537)

## ApiConfig Hydration Race on Early Bearer Token

`OntologyContextProvider` fires requests (`/api/v1/settings/`, `/api/v1/ontology/fetch_ontology_data`) before `DesktopContextProvider` hydrates `ApiConfig.settings`. Do not key cross-origin auth decisions on `ApiConfig.isUsingDefaultApi()`; compare `baseUrl !== window.location.origin` instead, which is correct from construction. (PR #740)

## `AsyncEventAdapter` Spreads the Payload — No Array Args

The adapter uses the spread operator on payload. Handlers that need to emit `[item1, item2]` must wrap once more: `[[item1, item2]]`. Otherwise the array is destructured into positional args. (PR #537)

## Schema Editor Relies on Fresh Workspace Items

After any `copy`/`paste` of workspace entities, refresh workspace items before opening the schema editor — it caches and returns 409 Conflict on stale state. (PR #710)

## Monaco Editor Callback Deps: Use Refs, Not Values

`MonacoEditor` callbacks that save on change must read from `fileRef.current` / `itemRef.current`, not `file.value` / `item` from closure. Including `file.value` in deps destroys and rebuilds the listener on every keystroke. (PR #684)

## `isDirty` Must Be an Explicit Prop, Not Derived From `!disabled`

`disabled` may later mean "saving in progress" or "read-only"; deriving dirty-state from it is fragile. Pass `isDirty` through explicitly. (PR #684)

## Prefer `as const` State Enums Over Raw String Unions

`state: 'RUNNING' | 'PAUSED'` drifts from call sites. Declare a `WATCHER_STATES` object with `as const` and derive the type — catches typos and centralizes the vocabulary. (PR #717)

## Date Line Wraparound Breaks Centroid Math

Map views averaging lat/lng across points crossing ±180° silently collapse to ~0°. Use a circular-mean (unit-vector) average, not arithmetic mean. (PR #726)

## CSS Class Name Conflicts Cascade Into Unrelated Panels

Do not reuse generic class names like `.custom-antlayout` across shared CSS files — a tweak in one component's stylesheet silently broke the schema editor by collapsing FlexLayout to 0 height. Prefix per-component. (PR #775)
