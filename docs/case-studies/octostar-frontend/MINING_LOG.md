# Mining Log — Octostar Frontend Case Study (2026-04-17)

## Corpus

- **Repo:** `Octostarco/octostar-frontend` (private monorepo, Turborepo + pnpm, React 18 + TypeScript, Vite).
- **Layout:** `apps/octostar`, `apps/search-app`, `apps/docs`; shared `packages/` (platform-api, platform-react, platform-types, ui, configs).
- **PR window:** 8 months, `merged:>=2025-08-18` through 2026-04-17.
- **`gh pr list --limit 500` returned:** 415 merged PRs (hitting the default `--limit 50` would have missed 365 of them).
- **Inline review comments fetched:** **3,114** across all 415 PRs (33 MB of JSON).
- **Cursor Bugbot comments:** 1,746 (56% of the total corpus).
- **Substantive human comments (length > 40 chars):** 1,051.
- **Top human reviewers:** `fullergalway` (506 total / 41 substantive critiques), `sscarduzio` (438 / 237 of which are author-dismissals), `fabiocorneti` (93 / 5), `eduardomecchiafernandez` (94), `bebossi` (82), `michelecerruto` (59).

## Top-level directory density

Substantive human review comments grouped by top-3 directory depth:

| Directory | Substantive comments |
|---|---|
| `apps/octostar/src/` | **909 (86%)** |
| `apps/search-app/src/` | 45 |
| `packages/octostar-platform-react/src/` | 42 |
| `packages/octostar-platform-api/src/` | 17 |
| `Dockerfile` | 15 |
| everything else | <10 each |

Inside `apps/octostar/src/`:

| Sub-module | Substantive comments |
|---|---|
| `components/Apps` | **442** |
| `components/Workspace` | 91 |
| `components/MultiRecordViewer` | 34 |
| `components/linkchart-nt` | 31 |
| `components/Entity` | 31 |
| `lib/DesktopAPI` | 26 |
| `components/AIChat` | 24 |
| others | <15 each |

## BUGBOT.md scope decisions

Following the review-density rule (top quartile earns its own scope, first-match-wins ordering):

1. `/.cursor/BUGBOT.md` — root (cross-app, cross-layer concerns)
2. `/apps/octostar/.cursor/BUGBOT.md` — octostar app-level (909 comments in src)
3. `/apps/octostar/src/components/Apps/.cursor/BUGBOT.md` — **Apps module** (442 comments; 200+ dismissals; 44 on a single file)
4. `/apps/search-app/.cursor/BUGBOT.md` — sibling app (45 comments; smaller but distinct framework patterns)
5. `/packages/.cursor/BUGBOT.md` — shared platform contracts (65 comments across subpackages)

**Skipped (density high but rules would duplicate parent scope):**

- `Workspace/` (91) — patterns are generic React (throttle-on-unmount, async effect guards) — already in root.
- `MultiRecordViewer/`, `linkchart-nt/`, `Entity/` (31 each) — per-module noise without clear recurring invariants; revisit via `/add-module` once dismissal density shows up.
- `lib/DesktopAPI/` (26) — AsyncEventAdapter rule lives in octostar app BUGBOT.md; not enough density for its own scope.

**scopeRules in harvest-lessons.yml** (deepest-first — first-match-wins loop):

```js
{ prefix: 'apps/octostar/src/components/Apps/', scope: 'apps-module' },
{ prefix: 'apps/octostar/',                     scope: 'octostar'    },
{ prefix: 'apps/search-app/',                   scope: 'search-app'  },
{ prefix: 'packages/',                          scope: 'packages'    },
```

## Author-dismissal mining (top-priority sub-phase)

### Detected dismissal-language comments

261 human-author replies to bot (Cursor Bugbot) findings using language: "dismiss", "won't fix", "false positive", "intentional", "by design", "not an issue", "not a bug".

Breakdown by author:

- `sscarduzio` — **237** (91%; overwhelming project lead presence on the App Editor track)
- `michelecerruto` — 10
- `bebossi` — 4
- `apierini-source` — 4
- `fabiocorneti` — 3
- others — 3

### Top dismissal-dense files

| File | Dismissals | Placement |
|---|---|---|
| `apps/octostar/src/components/Apps/ManifestEditor/ManifestEditorTab.tsx` | **44** | Apps-module BUGBOT.md (promoted; same-file 5+) |
| `apps/octostar/src/components/Apps/AppControlPanel.tsx` | 30 | Apps-module (same rationale family: state-setter / STATUS_MAP) |
| `apps/octostar/src/components/Apps/DeployTimeline.tsx` | 23 | Apps-module (onDismissRef pattern) |
| `apps/octostar/src/components/Apps/ManifestEditor/ManifestFormEditor/ManifestFormEditor.tsx` | 17 | Apps-module (formDataRef pattern) |
| `apps/octostar/src/components/Apps/DeveloperModeInline.tsx` | 13 | Apps-module |
| `apps/octostar/src/components/Apps/AppsContext.tsx` | 11 | Apps-module |
| `apps/octostar/src/components/Apps/CreateAppModal.tsx` | 11 | Apps-module (minLength boundary) |
| `apps/octostar/src/components/Apps/hooks/useSecretsManager.ts` | 11 | Apps-module (isDeployed guard) |
| `Dockerfile` | 6 | **Inline** (pnpm@8 pin rationale — single file, no scope fits better) |
| All other files with ≥3 dismissals | 3–9 | Apps-module (same module) |
| Files with 1–2 dismissals | various | Inline where file still exists and rationale is substantive (see below) |

### Recurring dismissal themes (each seen ≥5 times)

1. **"React state setters are stable"** (8+ instances on `setEditorStatus`, `setErrorMessages`, etc.) — Apps-module BUGBOT.md rule.
2. **"Ref pattern avoids stale closures"** (10+ on `formDataRef`, `contentRef`, `editorRef`, `onDismissRef`) — Apps-module BUGBOT.md rule.
3. **"`DeveloperManifestsProvider` wraps the entire tree"** (3+) — Apps-module rule.
4. **"`STATUS_MAP` returns singletons; useMemo stability is fine"** (4+) — Apps-module rule + inline comment on `status.ts`.
5. **"`isDeployed` guard on secrets is intentional"** (5+) — Apps-module rule.
6. **"CreateAppModal boundary `length < minLength` is correct"** (6+) — Apps-module rule.
7. **"pnpm@8 pin matches lockfile v6"** (6+) — inline comment in Dockerfile.

### Inline comments placed

1. `apps/octostar/src/components/Apps/status.ts` — above `STATUS_MAP`, explaining PascalCase K8s states and no `toLowerCase` coercion. *(Bugbot dismissed in PR #735)*
2. `Dockerfile` — above `RUN npm install -g pnpm@8.15.6`, explaining lockfile v6 compatibility. *(Bugbot dismissed 6+ times)*

### Dismissals dropped (stale / insubstantive)

- `apps/octostar/src/lib/DesktopAPI/DesktopAPI.ts` line 1397 — the original dismissal explained `MemoryStorageAdapter.appendItems` preserves references for `===` equality. The code around that line has been refactored; the specific idiom no longer lives at that location. Skipped.
- `apps/octostar/src/components/Apps/ManifestFormEditor.tsx` (old path, now under `ManifestEditor/ManifestFormEditor/ManifestFormEditor.tsx`) — the 2 dismissals here pre-date the refactor. Pattern subsumed by the Apps-module "ref pattern" rule.
- PRs 253, 260 — very early dismissals from before the Apps/App-Editor track started; no rationale worth extracting.
- "By design" / "not an issue" with no rationale (MapNT.tsx line 1322 and 1515) — too thin. Skipped.

## Senior reviewer critiques (adopted → rules)

Top 6 teaching moments harvested from `fullergalway`, `fabiocorneti`, `michelecerruto`, `varunsharma27`:

- **PR #781 / #425** (fullergalway × 3 across `JobsIO.ts`, `JobsTable.tsx`, `JobsTableColumns.tsx`) — "don't iterate `listAllWorkspaces`; use concurrency-capped `Promise.all` or `OntologyAPI.getEntity`." → root BUGBOT "Unbounded Promise.all" + Apps-module "Use asyncPool over workspace lists" + LESSONS.md fan-out section.
- **PR #717** (fabiocorneti on `WATCHER_STATES`) — "use `as const` enum rather than raw string unions." → octostar BUGBOT rule + LESSONS.md.
- **PR #717** (fullergalway on `useWorkspaceWatchers.ts`) — "`OntologyAPI.subscribe` returns an unsub; you MUST call it." → LESSONS.md educational (harder to statically enforce).
- **PR #684** (michelecerruto × 3 on `MonacoEditor.tsx`, `Controls.tsx`) — "callbacks should read `itemRef.current`, not `item.value`; deriving `isDirty` from `!disabled` is fragile." → octostar BUGBOT rules (2).
- **PR #604** (fabiocorneti on `Workspaces.tsx`) — "cancel throttled handlers in unmount cleanup." → root BUGBOT rule.
- **PR #732** (fabiocorneti on `WatcherViewer.tsx`) — date parsing without TZ marker is local-time. → root BUGBOT rule.
- **PR #775** (from the PR body itself — shared `.custom-antlayout` CSS collapsed the schema editor) → octostar BUGBOT + root BUGBOT rules.
- **PR #740** (from PR body — `ApiConfig` hydration race with cross-origin Bearer token) → octostar BUGBOT rule.
- **PR #735** (fullergalway on `useAppListState.ts`) — "use `useAsyncCallback` or `let mounted=true` guard." → Apps-module BUGBOT + LESSONS.md.

## Rules dropped and why

| Candidate rule | Dropped because |
|---|---|
| "Prefer `.less` over `.css`" (PR #348, #357, varunsharma27) | Style preference; author tagged with `_(optional, nitpick)_`. Belongs in a style guide, not BUGBOT. |
| "Use `.toGMTString()` for titles with timestamps" (PR #393) | Style / single-helper preference; not a cross-file invariant. |
| "`'timbr.os_thing'` vs `'timbr.os_business_workspace_record'`" (PR #509) | Domain-specific question, not a generalizable rule. |
| "Remove duplicate `AskAIButton` component" (PR #561) | A specific technical-debt item; not a rule — file-level TODO. |
| "Semantic search bindings logic refactored" (PR #737) | Narrative of a fix, not an invariant for future PRs. |
| "Add `@display_name` tag to concepts in ontology" (PR #790) | Aspirational; fails pre-gate "rules are for the code as it is". |
| "lint max-warnings in CI env" (PR #337) | One-line CI config tweak, not a reviewable pattern. |
| "`getExtraEntries` should exclude `os_*` keys" (PR #655) | SINGLE-FILE concern in `ConfirmDataModal.tsx`; captured in the file itself via that PR's fix. |

## Live-pattern verification (recheck section 4)

All 31+ concrete symbols mentioned in rules were grep-verified to still exist in the tree:

| Rule symbol | Live in tree? |
|---|---|
| `eventemitter3` | 4 matches, including the guarding `// Don't change from EventEmitter3 without checking consequences` comment on `interface.ts:1` |
| `ApiConfig.isUsingDefaultApi` | 3 matches — rule is live. |
| `AsyncEventAdapter` | 2 matches — live. |
| `MonacoEditor` | 16 matches — live. |
| `WATCHER_STATES` | 4 matches; `as const` enum adopted. |
| `STATUS_MAP`, `getStatusConfig` | Live in `Apps/status.ts`. |
| `DeveloperManifestsProvider` | Live at `App.tsx:72`. |
| `asyncPool`, `MAX_PARALLEL_OPS` | Live in `Workspace/dragHandlers.ts:23,25`. |
| `formDataRef`, `contentRef`, `editorRef` | All live in `ManifestEditor/*`. |
| `DeployPhase` | 5 matches — union type still `'idle'|'deploying'|'ready'|'failed'`. |
| `ontologyAPI.getEntity` | 4 matches in packages/. |

scopeRules directories: **all 4 exist**.

## First-use findings (skill issues worth reporting)

1. **`--limit 50` default is way too low for mature repos** — the skill's `setup.md` example showed `--limit 50`. An 8-month window here had 415 merged PRs; the default would have missed 88% of the corpus. The task overrode to `--limit 500`. The skill should auto-scale the default based on `gh api /repos/{o}/{r}` PR-count and the requested window, or document a rule of thumb ("30–50 merged PRs/month is typical for active repos; set `--limit` to cover your window").
2. **Bot-authored reply detection needs Cursor-specific login** — the skill's generic "look for bot logins" guidance covers `cursor` and `cursor[bot]`, but the Octostar repo used `cursor[bot]` consistently. Worked fine — just noting that the workflow template's `botLoginsLower` set already includes both.
3. **Author-dismissal yield dominates setup** — 261 dismissals vs 62 substantive senior critiques. Skill should call out in `setup.md` that for a Bugbot-using repo, the author-dismissal scan (`harvest.md`'s top-priority sub-phase) is the **primary** yield of setup, not an afterthought in harvest. Currently `setup.md` Step 2 talks about "promising PRs" and "bug-fix PRs" before mentioning dismissals.
4. **`setup.md` Step 3 grep for review-density didn't match the jq reality** — the example `jq -r '.[] | select(.path != null) | .path' comments/*.json` treats each file as a single JSON array, but this case required merging 415 files via `jq -s 'add | ...'`. The first command silently produces empty output on per-file JSON arrays. Fixed here, but documenting.
5. **`recheck.md` Section 1 can't distinguish filename strings from content symbols** — grepping for `"interface.ts"` as content returns 0 matches (because almost no code references filenames by string). The recheck found 2 false STALEs this way. A heuristic: "if the symbol ends in `.ts`/`.tsx`/`.scala`, use `find` to verify the file exists, not grep for content."
6. **`setup.md` Step 7 — CLAUDE.md / AGENTS.md already had other content.** The skill's instructions worked cleanly (insert near the top), but since the existing CLAUDE.md had its own "# CLAUDE.md" + description, the pointer lines landed below the opening paragraph rather than as the first line under the heading. That's probably fine, but worth codifying: "insert after the first paragraph below the H1, not before everything."
7. **Deepest-first ordering of `scopeRules` was critical** — the template's comment already says this after the v0.7 fix, and I applied it correctly. Good.

## Summary

- **5** BUGBOT.md files (root, octostar, Apps module, search-app, packages)
- **39** total enforceable rules (10 + 10 + 10 + 5 + 4)
- **10** LESSONS.md entries
- **2** inline SINGLE-FILE comments (with PR-provenance cites)
- **Worst-case combined BUGBOT word count (root + octostar + Apps module):** 1,214 words ≈ ~1,620 tokens (target < 2,000).
- **Every rule cites a specific PR** — no `(bootstrapped — verify after usage)` tags. This is a heavily-reviewed repo.
- **Rules-from-author-dismissals:** 8 of 39 rules (~20%) directly encode author-dismissal rationale, plus 2 inline comments. Another ~6 Apps-module rules indirectly codify recurring dismissal themes. Total dismissal-derived share: **~36% of rules (14/39)**.
