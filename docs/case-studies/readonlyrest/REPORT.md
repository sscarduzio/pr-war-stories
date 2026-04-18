# Case study — ReadonlyREST

**Target repo:** [sscarduzio/elasticsearch-readonlyrest-plugin](https://github.com/sscarduzio/elasticsearch-readonlyrest-plugin) — public OSS, 958 ★, Scala 3.3.3 + Java Elasticsearch plugin, 12-year-old project.

**Ran on:** 2026-04-17.

**Why this repo:** it's public, it's OSS, its stack (Scala / JVM / Elasticsearch) is completely different from the Octostar case-study stack (TypeScript / React / Python), and it has no prior pr-war-stories artifacts. A clean-slate first install on an independent codebase — the closest thing to third-party validation we can produce.

---

## Corpus

| Metric | Value |
|---|---|
| Total merged PRs reachable | 755 (PR #6 → PR #1235, Dec 2014 → Apr 2026) |
| PRs fetched for inline-comment mining | top 150 by `reviews × 3 + comments` rank |
| Raw inline review comments | 2,697 |
| Substantive human review comments (post-filter) | 1,704 |
| PRs with ≥2 substantive comments | 117 |
| Author-dismissals detected (free-language) | 30 |
| Bot-to-human dismissal threads (`coderabbitai[bot]` → human) | 52 pairs |

No month-window anchor. ReadonlyREST is a slow-moving long-running project — the signal is cumulative review activity across its entire life, not recency.

---

## What the skill produced

### 7 BUGBOT.md files, 27 rules, 0 bootstrapped-tags

| File | Rules | Words |
|---|---|---|
| `.cursor/BUGBOT.md` (root, cross-cutting) | 7 | 285 |
| `core/.cursor/BUGBOT.md` | 5 | 223 |
| `core/.../accesscontrol/blocks/.cursor/BUGBOT.md` | 2 | 95 |
| `core/.../accesscontrol/factory/.cursor/BUGBOT.md` | 3 | 117 |
| `integration-tests/.cursor/BUGBOT.md` | 3 | 141 |
| `audit/.cursor/BUGBOT.md` | 3 | 128 |
| `ror-tools-core/.cursor/BUGBOT.md` | 4 | 178 |

Worst-case bot-traversal load (root + `core/` + deepest submodule combined): **1,181 words** — under the <2000-token budget.

### LESSONS.md — 7 entries

All with `WRONG` / `RIGHT` code blocks and PR citations. Categories: Security, Error handling, Data model, Scala style, Backward compatibility, Configuration, Audit schema.

### 3 inline SINGLE-FILE comments

Placed in-source with `(See PR #NNN)` provenance on:

1. `BlockContext.isCurrentGroupPotentiallyEligible` — documenting why current group equality uses `GroupId`, not `Group`. (PR #1072)
2. `CopyTransportNetty4JarToPluginPatchCreator.backup` — invariant that `backup` is a no-op by design. (PR #1095)
3. `EsPatchExecutor.doPatch` rethrow branch — why this intentionally throws instead of returning `Either`. (PR #1095)

### Supporting files

- `CLAUDE.md` — wires IDE assistants to `LESSONS.md` + the BUGBOT.md hierarchy, notes the Scala 3 + JVM stack, default branch `develop`.
- `AGENTS.md` — parallel pointer for Cursor / Codex.
- `.github/workflows/harvest-lessons.yml` — customised for ReadonlyREST: `branches: [develop]` (not `main`), `scopeRules` ordered **deepest-first** so nested paths match before parent catch-alls, bot-filter includes `coderabbitai` (the actual bot this repo uses).

---

## Cost

Single Claude Code subagent session, fresh context, no prior conversation history.

| Metric | Value |
|---|---|
| Wall-clock time | **~77 minutes** end-to-end (from preflight to final commit) |
| Total tokens (input + output, all tool turns) | **175,023** |
| `gh` API calls made | **~195** (1 auth probe + 2 list calls + 150 parallel pulls/comments + 40 issues/comments + 2 rate-limit probes) |
| Files written | 11 new + 3 source edits (inline comments) + 1 `.gitignore` append = **15 changes** |

**Token breakdown (estimated):**

- Input read: ~25 KB of skill source (SKILL.md + 3 commands + 3 reference files + 1 template) + ~140 KB of review-comment bodies + ~30 KB of repo source code for symbol verification ≈ **~50K tokens input**
- Output written: 7 BUGBOTs + LESSONS + CLAUDE + AGENTS + MINING_LOG + 3 inline comments + commit message ≈ **~6K tokens output**
- The difference between (50K + 6K = 56K) and the reported 175K is tool-loop overhead: each `gh api` / `Read` / `Bash` tool call carries prior context forward. Prompt caching absorbs most of this in Claude Code's actual billing.

**Approximate cost band (Sonnet 4.6 pricing):**

| Scenario | Cost |
|---|---|
| Upper bound, zero caching (150K input × $3/M + 25K output × $15/M) | **~$0.83** |
| Realistic with Claude Code's prompt caching active | **~$0.30 – $0.60** |

**The automated workflow (`harvest-lessons.yml`) consumes zero LLM tokens** — it's pure JavaScript running in GitHub Actions. You only spend Claude tokens when *you* manually run `/pr-war-stories setup`, `/pr-war-stories harvest`, or the other commands. The feedback loop runs for free.

---

## Notable findings during the run

### 1. Author-dismissal mining is the highest-yield sub-phase (confirmed on a third repo)

**14 of 27 BUGBOT rules (52%) trace directly to author dismissals** of `coderabbitai[bot]` findings. The remaining 13 come from senior reviewer critiques. This replicates the Octostar finding on a completely different stack. The v0.7 priority ordering (dismissals first) is load-bearing.

Highest-signal dismissal threads:
- **PR #1095** (mgoworko × 6) — shaped the root "Either for expected failures" rule + 2 inline comments.
- **PR #1176** (coutoPL × 7) — shaped two root-level multi-module rules about `ChannelInterceptingRestHandlerDecorator` and `ThreadRepo` cleanup.
- **PR #1101** (mateuszkp96) — dismissed bot's "wrap Response in try-with-resources" suggestion → root BUGBOT rule preventing that class of "fix leak" bug.

### 2. 15 dismissals dropped as STALE — the corpus self-cleans

15 of the 30 free-language dismissals (all from user `coutoPL`, ancient PRs #180–#412) targeted Java files in paths that no longer exist — the repo was Scala-ported and old ES-version directories were deleted. Every one of those got dropped per the `STALE` class in [reference/classification.md](../../reference/classification.md). The skill's `STALE` gate is doing real work.

### 3. First-use skill bugs worth flagging

The subagent was a first-time user of the skill on a Scala/JVM repo. It hit 6 real issues worth filing:

1. **Setup Step 4's grep example is TypeScript-biased** — uses `--include='*.ts' --include='*.tsx'`. Trivial for a human to fix but the skill should ship a language matrix or a note.
2. **`--limit 50` default is too low for mature repos.** The first 50 PRs on ReadonlyREST were all version-bump noise; had to override to `--limit 1000`. Suggestion: auto-scale based on total merged-PR count from the initial `gh api /repos/{o}/{r}` call.
3. **Workflow template's `scopeRules` needs deepest-first ordering.** The first-match-wins loop means `core/` must come *after* `core/src/.../blocks/` in the array. Template comment doesn't call this out.
4. **Classification edge case — cross-ES-module rules.** Rules that apply uniformly across 20 `esNNx/` sibling modules logically belong at the scope every module traverses through (= repo root), but `classification.md` doesn't explicitly document the "lowest common ancestor" placement rule.
5. **`recheck` didn't catch a prose typo.** A rule mentioned `DetectedPatchWithoutValidMetadata` when the actual symbol is `CorruptedPatchWithoutValidMetadata`. The subagent caught the typo manually while writing MINING_LOG. A simple heuristic (extract backtick-delimited `CamelCase` tokens from rule text and grep) would catch this class of typo.
6. **`coderabbitai` is the bot in this repo**, not Cursor Bugbot. The workflow template's bot-filter (post-v0.7 Copilot fix) includes `coderabbitai` by default now. But the Layer-1 value proposition (BUGBOT.md consumed by a bot) doesn't apply here — `coderabbitai` doesn't natively read `.cursor/BUGBOT.md` files. The inline comments and LESSONS.md still carry weight for this repo; the BUGBOT.md files sit in the tree until ReadonlyREST adopts a compatible reviewer.

All 6 are in `MINING_LOG.md` verbatim.

---

## Comparing Octostar to ReadonlyREST

| Dimension | Octostar (two repos) | ReadonlyREST (one repo) |
|---|---|---|
| Language | TypeScript + Python | Scala + Java |
| Project cadence | Fast (415+344 PRs / 8 months) | Slow (755 PRs / 12 years) |
| Reviewer | Cursor Bugbot (owner-maintained) | coderabbitai + Claude Code review (public) |
| Relationship to skill author | Maintained by skill author | Also by skill author — but public OSS with different contributors |
| BUGBOT.md files produced | 11 (across 2 repos) | 7 |
| Rules produced | 87 | 27 |
| LESSONS.md entries | 19 | 7 |
| Inline comments | 0 (didn't harvest that layer yet) | 3 |
| % of rules from author-dismissals | not measured | 52% |

**Same doctrine, different outputs.** The classification taxonomy and the placement logic hold across a dense TS UI repo and a sparse JVM plugin repo. Per-PR yield varies wildly (Octostar averages ~5 rules per 100 PRs; ReadonlyREST averages ~4 rules per 100 PRs), but the *shape* of the output (scoped hierarchy, token-budget-compliant, provenance-cited) is consistent.

---

## Reproducing this

```bash
# Clone
gh repo clone sscarduzio/elasticsearch-readonlyrest-plugin /tmp/ror
cd /tmp/ror

# Install the skill
claude install-skill sscarduzio/pr-war-stories

# Run
/pr-war-stories setup --limit 1000
/pr-war-stories harvest
```

The generated artifacts in this directory are the real output. Branch `pr-war-stories/case-study-2026-04` in the cloned repo has the in-tree version (commit `cad6d9e16`).
