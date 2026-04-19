# Case study — octostar-frontend

**Target repo:** `Octostarco/octostar-frontend` — private Turborepo monorepo. React 18 + TypeScript + Vite. Two apps (octostar, search-app), shared packages. Heavily-reviewed codebase with Cursor Bugbot active on every PR.

**Ran on:** 2026-04-17. Clean-slate measurement run on branch `pr-war-stories/case-study-2026-04`.

## Corpus

| Metric | Value |
|---|---|
| PR window | 8 months (merged ≥ 2025-08-18), 415 merged PRs |
| Inline review comments fetched | 3,114 |
| Cursor Bugbot (`cursor[bot]`) comments | 1,746 (56% of corpus) |
| Substantive human comments (>40 chars) | 1,051 |
| Top commenters | fullergalway (506), sscarduzio (438), fabiocorneti (93) |
| Author-dismissal rationales surfaced | 261 |

**86% of all human review comments land in `apps/octostar/src/`** — one directory dominates review attention. Inside that, 442 comments concentrate in `components/Apps/` alone.

## What the skill produced

### 5 BUGBOT.md files, 39 rules

| File | Rules | Words |
|---|---|---|
| `.cursor/BUGBOT.md` (root) | 10 | ~500 |
| `apps/octostar/.cursor/BUGBOT.md` | 10 | ~500 |
| `apps/octostar/src/components/Apps/.cursor/BUGBOT.md` | 10 | ~500 |
| `apps/search-app/.cursor/BUGBOT.md` | 5 | ~280 |
| `packages/.cursor/BUGBOT.md` | 4 | ~260 |

Worst-case bot-traversal load (root + octostar + Apps-module combined): **1,214 words ≈ 1,620 tokens** — 19% headroom against the 2000-token target.

### LESSONS.md — 10 entries

React + TS patterns with real `WRONG` / `RIGHT` code: useState vs useRef synchronisation, async effect staleness, Promise.all fan-out with concurrency limit, `as const` enums over string unions, workspace-watcher subscribe/unsubscribe, ApiConfig hydration races, etc.

### 2 inline SINGLE-FILE comments

1. `apps/octostar/src/components/Apps/status.ts` — above `STATUS_MAP`, explaining K8s state casing and no-coercion invariant. (Bugbot dismissed in PR #735)
2. `Dockerfile` — above `RUN npm install -g pnpm@8.15.6`, explaining lockfile v6 compatibility. (Bugbot dismissed 6+ times)

## Cost

| Metric | Value |
|---|---|
| Wall-clock time | **~17 minutes** end-to-end |
| Total tokens (input + output, all tool turns) | **150,509** |
| `gh` API calls | **~421** (1 PR-list + 415 per-PR comments + 5 samples) |
| Files written | 5 BUGBOT + LESSONS + workflow + 2 inline edits + CLAUDE/AGENTS patches |

Approximate Sonnet 4.6 cost: **~$0.25–0.60** (depending on cache hit rate).

## Notable findings

### 1. One-module dominance — density-based hierarchy ranking works

The v0.7 doctrine's ranking rule (top-quartile by comment density gets its own scope) correctly identified `apps/octostar/src/components/Apps/` as the #1 scope candidate: 442 substantive comments, 200+ author dismissals, a single file (`ManifestEditorTab.tsx`) with 44 dismissals of its own.

Under the old intuition-based guidance, a user might have picked `Composer/` or `linkchart-nt/` — visible-complexity modules that turned out to have <35 comments each. The density ranking doesn't rely on judgment.

### 2. Author-dismissals are the primary setup yield (261 vs 62 senior critiques)

4.2× more dismissals than senior reviewer critiques. 14 of 39 rules (**36%**) directly encode dismissal rationale. **Both inline comments are 100% dismissal rationale verbatim.**

This is the strongest data point yet for the v0.7 priority ordering: for a repo using a bot reviewer, dismissals are not a "nice-to-have" harvest source — they are the primary yield of initial setup. A user who skipped them would have missed the majority of available rule material.

### 3. First-use skill issues found

Six, all feeding back to a future skill revision:

1. **`--limit 50` default is inadequate for mature repos.** Would have captured 12% of the 415-PR corpus.
2. **Setup Step 3 review-density jq example is wrong** for multi-file input; needs `jq -s 'add | ...'`.
3. **Setup's ordering understates dismissal yield.** Step 2 lists "promising PRs" and "bug-fix PRs" before dismissals — misrepresents where the value is.
4. **`recheck` Section 1 can't distinguish filename strings from content symbols.** Heuristic needed: if symbol ends in `.ts`/`.tsx`/`.scala`, use `find -f` instead of content grep.
5. **CLAUDE.md / AGENTS.md pointer placement under-specified.** Both files had first-paragraph content already; Step 7 didn't specify "after the intro paragraph."
6. **Deepest-first `scopeRules` ordering worked.** The v0.7 template comment was followed correctly — no issue here, called out as a positive.

Items 1 and 2 replicate issues found on the ReadonlyREST run. Same lesson, same miss across two runs = skill bug to fix.

## Full artifacts

All 9 files in this directory. `MINING_LOG.md` has the complete reviewer breakdown, hierarchy decisions, rule-dropped rationale, and live-pattern verification.
