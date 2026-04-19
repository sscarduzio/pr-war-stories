# Bugbot Rules (Global)

Cross-cutting rules that apply to every PR. Module-scoped rules live in nested `BUGBOT.md` files.

## Cross-App Impact

Both `apps/octostar` and `apps/search-app` import from `@octostar/platform-api`, `@octostar/platform-react`, and `@octostar/platform-types`. A change to any package export breaks two consumers — verify both apps still build. (PR #508, #716)

## CDN Base Path Breaks Absolute Asset URLs

Apps are served from `/cdn/octostar/` and `/cdn/search-app/` — never hardcode absolute paths starting with `/` for assets. Use `import.meta.env.BASE_URL` or relative URLs. (PR #766)

## React State-Setter in useEffect Deps Is a Wash

`useState` setters (`setX`) are referentially stable per React docs. Do not flag `[...setters]` in dep arrays as missing; the setter never changes identity. (PR #735, dismissed 15+ times)

## Unbounded Promise.all Causes OOM

`Promise.all(items.map(...))` with an unbounded `items` will OOM on large inputs. Use a concurrency limiter (`asyncPool` at `apps/octostar/src/components/Workspace/dragHandlers.ts:25`, limit 3–5). (PR #781)

## JSON.stringify Drops undefined, Not null

`JSON.stringify({a: undefined})` → `"{}"`. To clear a server-side field, send `null`, not `undefined` — the property will vanish silently otherwise. (PR #770)

## Math.max()/Math.min() on Possibly-Empty Arrays

`Math.max()` returns `-Infinity`, `Math.min()` returns `Infinity`. Before `Math.max(...arr)` check `arr.length > 0` or use an explicit fallback (`Number.MAX_SAFE_INTEGER`). Pattern in `QueryRecorder.tsx`. (PR #782)

## Shared CSS Class Names Break Unrelated Panels

Generic class names (`.custom-antlayout`, `.modal-header-title`) in one component's CSS file reach every unrelated component using the same class. Scope styles per-component — use CSS Modules or a component-prefixed class. (PR #775, #357)

## Cancel Throttled/Debounced Handlers on Unmount

Lodash/utility `throttle`/`debounce` callbacks scheduled after unmount leak state. Return `() => fn.cancel()` from the `useEffect` that created them. (PR #604)

## Async Effects Need Stale-Update Guards

After any `await` inside `useEffect` the component may have unmounted. Use `useAsyncCallback` or the `let mounted=true; return () => { mounted=false }` pattern — do not `setState` unconditionally after await. (PR #735)

## Date Parsing Without Timezone Is Wall-Clock Ambiguous

`new Date(str)` treats ISO-8601 without `Z` or `±hh:mm` as local time. If the backend returns UTC-ish strings, normalize: append `'Z'` when no TZ is present. (PR #732)
