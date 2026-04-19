# Engineering Lessons Learned

Hard-won lessons from real bugs, PR reviews, and production incidents. **Read this before reviewing or writing code.**

These are write-time lessons for the IDE assistant. Review-time enforceable rules live in `.cursor/BUGBOT.md` files — do not duplicate.

---

## React State & Timing

### Read refs, not closure values, from stable callbacks

When a `useCallback` must see "the latest value" but you do NOT want the callback to be re-created (breaking downstream memoization or triggering re-subscribes), mirror the value into a ref and read `ref.current`.

```tsx
// WRONG: listener tears down and re-subscribes on every keystroke
const handleChange = useCallback(() => {
  save(file.value);
}, [file.value]); // re-runs on every change of file.value

// RIGHT: ref mirror, callback is stable
const fileRef = useRef(file);
fileRef.current = file;
const handleChange = useCallback(() => {
  save(fileRef.current.value);
}, []); // stable identity, always sees fresh value
```

(PR #684, #735)

### useState setters are always stable — don't include them in deps

React guarantees `useState` setters are referentially stable across renders. Adding them to `useEffect` / `useCallback` deps is harmless but signals the author misunderstood the rule.

```tsx
// NOISE (not wrong, but reveals misunderstanding):
useEffect(() => { sync(); }, [sync, setStatus]);

// CLEAN:
useEffect(() => { sync(); }, [sync]);
```

(PR #735, dismissed 15+ times)

### Guard async effects with a mounted flag or `useAsyncCallback`

Any `await` inside a `useEffect` may resolve after unmount. Unguarded `setState` logs "can't set state on unmounted component" and leaks.

```tsx
// WRONG
useEffect(() => {
  fetch(id).then(setData); // may fire after unmount
}, [id]);

// RIGHT
useEffect(() => {
  let mounted = true;
  fetch(id).then((d) => { if (mounted) setData(d); });
  return () => { mounted = false; };
}, [id]);
```

(PR #735)

---

## Serialization & API Contracts

### Use `null`, not `undefined`, to delete a field server-side

`JSON.stringify` drops keys whose value is `undefined`. If your API contract is "null means delete, omitted means unchanged", `undefined` collapses into "unchanged" — silently reverting a delete.

```ts
// WRONG
await api.update(id, { description: undefined }); // server sees nothing

// RIGHT
await api.update(id, { description: null }); // server clears the field
```

(PR #770)

### Log before silently normalizing unexpected types

Platform utilities receiving an unexpected type (string where object expected, etc.) should log a warning with the received value before coercing. Silent coercion turns upstream bugs into data corruption reports two releases later.

```ts
// WRONG
function toUrl(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v;
}

// RIGHT
function toUrl(v: unknown): string {
  if (typeof v !== 'string') {
    console.warn('[toUrl] expected string, got', typeof v, v);
    return '';
  }
  return v;
}
```

(PR #517)

---

## Bundle & Runtime

### CDN base paths break `Math.max(...emptyArray)` in subtle ways

`Math.max()` returns `-Infinity`, `Math.min()` returns `Infinity`. When these leak into sort keys, arithmetic, or HTTP payloads, errors cascade far from the source.

```ts
// WRONG
const maxDuration = Math.max(...items.map((i) => i.duration));
// items=[] → -Infinity; if serialized, JSON.stringify outputs `null`

// RIGHT
const maxDuration = items.length
  ? Math.max(...items.map((i) => i.duration))
  : 0;
```

(PR #782)

### Prefer `as const` enums over raw string unions

String-union types drift: a rename in the type doesn't propagate to the many `'RUNNING'` literals scattered in code, and TS accepts typos as valid strings in some positions.

```ts
// WRONG
type WatcherState = 'RUNNING' | 'PAUSED';
function setState(s: WatcherState) { /* ... */ }
setState('RUNING'); // may compile depending on inference

// RIGHT
export const WATCHER_STATES = { RUNNING: 'RUNNING', PAUSED: 'PAUSED' } as const;
export type WatcherState = typeof WATCHER_STATES[keyof typeof WATCHER_STATES];
setState(WATCHER_STATES.RUNING); // compile error
```

(PR #717)

---

## Infrastructure & Integration

### Early requests can race provider hydration

Context providers hydrate bottom-up or in parallel. A deep provider that fires HTTP requests at mount may run before a parent provider's state is populated — leading to "wrong API base URL" / "missing token" bugs that disappear on refresh.

Do not key auth or routing on state that comes from a sibling provider mounted in the same render. Instead derive from immutable inputs (e.g., `baseUrl !== window.location.origin` is correct from construction).

(PR #740)

### `OntologyAPI.subscribe` returns an unsubscribe — you MUST call it

Entity notifications via `OntologyAPI.subscribe(entity, callback)` register with the FirehoseManager. Not calling the returned `unsub` leaks both the FirehoseManager registration and the closure over `entity`/`callback` for the process lifetime.

```tsx
// WRONG
useEffect(() => {
  OntologyAPI.subscribe(entity, handleChange); // leaked forever
}, [entity]);

// RIGHT
useEffect(() => {
  const unsubP = OntologyAPI.subscribe(entity, handleChange);
  return () => {
    unsubP.then((unsub) => unsub?.());
  };
}, [entity]);
```

(PR #717)

### Concurrency-cap network fan-out over lists

Any loop issuing one request per item over a server-returned list is a denial-of-service waiting to happen when the list grows.

```ts
// WRONG: N simultaneous requests, may OOM tab or thrash server
const results = await Promise.all(items.map(fetchDetail));

// RIGHT: use the repo's asyncPool helper (apps/octostar/src/components/Workspace/dragHandlers.ts)
const results: Result[] = [];
await asyncPool(3, items, async (item) => {
  results.push(await fetchDetail(item));
});
```

(PR #425, #781)
