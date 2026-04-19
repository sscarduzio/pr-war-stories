# Bugbot Rules (search-app)

Scope: `apps/search-app/`. Smaller sibling app consuming the same platform packages as `apps/octostar`.

## Avoid Inline Style Objects in React

Inline `style={{...}}` creates a new object every render, breaking memoization downstream. Prefer a CSS class (or at minimum a module-scope `const STYLE = {...}`). (PR #482)

## LRU Cache Already Exists at the API Layer

`OntologyAPI` uses `lru-cache`. Do not add a second component-level cache for the same data — cache-invalidation-squared is harder than the original problem. Check platform-api first. (PR #716)

## Reusable Helpers Belong in `packages/octostar-platform-api`

Utilities like `formatBytes`, date formatters, and entity adapters that already exist in `apps/octostar` should move to a platform package before being copied into search-app. Duplicate utilities drift. (PR #716)

## Date Line Crossing: Don't Average Lat/Lng Arithmetically

Map centroid code in `MapResultsView.tsx` that averages longitudes breaks for points near ±180° (collapses to ~0°). Use a circular mean. (PR #726)

## Cross-Origin Image Fetches Need `os_jwt` + `os_ontology` Cookies

Modal and fullscreen image fetches must hit URLs that pass the auth cookies (`os_jwt`, `os_ontology`) — cross-origin `<img src>` with `crossorigin="use-credentials"` or a same-origin proxy, not a bare CDN URL. (PR #641)
