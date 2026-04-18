# Mining Log — ReadonlyREST Case Study (2026-04-17)

## Corpus

- **Repo:** `sscarduzio/elasticsearch-readonlyrest-plugin` (public OSS, 958 stars, Scala 3.3.3 + Java, ES plugin).
- **PR window:** all merged PRs; `gh pr list --state merged --limit 1000` returned **755**.
- **PRs fetched for inline comments:** top **150** ranked by `reviews*3 + comments` metric.
- **Inline comments retrieved:** 2,697 total across those 150 PRs.
- **Substantive human comments (after filtering):** 1,704.
- **Active PRs (≥2 substantive comments):** 117. Scoping estimate said 53 — actual is higher because the filter here was "substantive" not "reviewable + non-style".

## Top-level directory density

| Top-level dir | Substantive comments on files there |
|---|---|
| `core/` | 920 (54%) |
| `integration-tests/` | 117 |
| `ror-tools-core/` | 111 |
| `tests-utils/` | 99 |
| `audit/` | 77 |
| `ror-tools/` | 74 |
| `es67x/`…`es92x/` | 33+29+23+…(long tail; 100+ combined) |
| others | <25 each |

Inside `core/`, the heat is concentrated:
- `accesscontrol/blocks/` — 243
- `accesscontrol/factory/` — 146
- `accesscontrol/audit/` — 52
- `accesscontrol/domain/` — 47
- `configuration/` — 28 + 7 (files)

## BUGBOT.md scope decisions

Created at:

1. `/.cursor/BUGBOT.md` — root (cross-cutting Scala + ES-module sync)
2. `/core/.cursor/BUGBOT.md` — core module
3. `/core/src/main/scala/tech/beshu/ror/accesscontrol/blocks/.cursor/BUGBOT.md` — ACL blocks (top-quartile density within core)
4. `/core/src/main/scala/tech/beshu/ror/accesscontrol/factory/.cursor/BUGBOT.md` — decoders (2nd highest in core)
5. `/integration-tests/.cursor/BUGBOT.md` — container suites
6. `/audit/.cursor/BUGBOT.md` — Java-friendly SPI
7. `/ror-tools-core/.cursor/BUGBOT.md` — ES patcher

**Skipped (density high, but rules would duplicate core/root):**
- `tests-utils/` (99 comments) — rules are generic Scala testing patterns, covered by root rules.
- `ror-tools/` (74) — thin CLI wrapper; rules belong in ror-tools-core.
- All `esNNx/` modules — rules that apply span all of them; placed at root instead.

## Author-dismissal mining

### Detected dismissal-language comments
30 comments from humans using language like "intentional", "by design", "won't fix", "on purpose". Breakdown by author:

- `coutoPL` — 20 (senior reviewer; 15 of these are `"won't fix"` from ancient PRs 180, 207, 214, 412 in pre-Scala-port Java code that no longer exists — STALE)
- `mgoworko` — 7 (recent, rich detail)
- `mateuszkp96` — 3

### Bot-to-human threaded dismissals (strongest signal)

52 pairs where a human replied to a `coderabbitai[bot]` comment. Authors whose replies were harvested:

- PR #1083 — coutoPL dismissing coderabbit on `RorToolsApp` sealed-class suggestion. Partially adopted — `sealed class RorToolsError` still exists in tree.
- PR #1095 — mgoworko × 6 on `EsPatchExecutor`, explaining `Either` vs throwing boundary. **Strong signal → shaped the root "Either for expected failures" rule + inline comment in `doPatch`.**
- PR #1095 — mgoworko on `CopyTransportNetty4JarToPluginPatchCreator.backup()` being a no-op. **→ inline comment + ror-tools-core BUGBOT rule.**
- PR #1101 — mateuszkp96 dismissing coderabbit twice on `Response` autoclose across ES modules. **→ root BUGBOT rule (cross-module).**
- PR #1163 — mgoworko dismissing coderabbit on `SignatureCheckMethod.NoCheck` (bot was wrong) and on Scala 2 vs 3 import. **→ root BUGBOT Scala-3 rule.**
- PR #1176 — coutoPL × 7 dismissals on `ChannelInterceptingRestHandlerDecorator` and ThreadRepo cleanup across ES modules. **→ root BUGBOT for both.**
- PR #1182 — JWT decoder suffix hardcoding, test-name mismatch (coutoPL pinging mgoworko). **→ core BUGBOT rule on deprecation-warning suffixes.**
- PR #1206 — marker-trait debate on `AuditLogSerializer` (coutoPL accepting bot's marker-trait suggestion, mgoworko proposing `AuditIndexSchema` ADT which became the adopted solution). **→ core BUGBOT rule + audit BUGBOT rule.**
- PR #1216 — mateuszkp96 × 2 dismissals on test-tooling and semaphore-leak bot warnings. Scope-local, not promoted.

### Dismissals dropped as STALE

- PRs 180, 207, 214, 412 — all 15 `"won't fix"` comments from coutoPL. Target files live in `src/main/java/org/elasticsearch/plugin/readonlyrest/...` or `corex/` or `es63x-experimental/` — paths that no longer exist in the tree (repo was Scala-ported and old ES versions dropped). Verified: `find . -name 'LdapClientException.java'` → 0 results.
- PR #1139 — three `"this is ok"` replies from coutoPL on gradle.properties version bumps. Too generic to rule-ify; no invariant stated.
- PR #1064 — mateuszkp96 "Libs with vulnerabilities are used only in tests." Dismissal of a single coderabbit finding; not a general invariant.
- PR #1136 — azure-pipelines.yml dismissals — CI-specific one-offs, no cross-file pattern.

## Rules dropped and why

| Candidate rule | Dropped because |
|---|---|
| "Prefer `sealed trait` over `sealed class` for ADT roots" | `sealed class RorToolsError(val message: String)` still present in tree (PR #1083 suggestion was partially rejected). Fails quality-bar "Code is real" + "adopted" checks. Moved to CLAUDE.md house-style, not LESSONS.md. |
| "X-Forwarded-For fallback is a security risk" (as a BUGBOT rule) | Target file `RequestInfo.java` no longer exists (STALE for BUGBOT). Kept in LESSONS.md as EDUCATIONAL — the security principle transcends the one deleted file. |
| "`performPatching` should return EsPatch status for isPatched check" | Refactored — `isPatched` now uses `checkWithPatchedByFileAndEsPatch()`, the discussion in PR #1095 is about code that was subsequently replaced. STALE. |
| "Use better-files for temp dirs" (PR #1083) | Style preference (reviewer suggestion not clearly adopted). Dropped per pre-gate. |
| "Split `In` and `Out` interface" (PR #1083) | Reviewer question, not a rule. Dropped. |
| "Return status code 0 from verify when patched" (PR #1095) | CLI ergonomics, one-off config decision, not a reviewable invariant. Dropped. |
| "Never allow empty groups in `RorKbnAuthRule` tests" (PR #1163) | Test-structure preference, belongs in a style guide, not BUGBOT. Dropped. |
| "Use GroupsLogicResolver instead of redefining GroupsLogic hierarchy" (PR #1072) | Design-refactor suggestion; corpus shows it was discussed and not fully adopted in that PR. Ambiguous → skip per harvest.md rule 4. |

## Live-pattern verification (recheck step 4)

| Rule anti-pattern | Live in tree? |
|---|---|
| `catch Throwable` (root rule) | **0 matches** — the anti-pattern is extinct. Rule kept as defensive (prevents re-introduction). Flag for `/pr-war-stories audit` next quarter. |
| `sealed class` for ADT roots | 2 matches: `RorToolsError`, `ADecoder.SyncDecoder`. Intentional (constructor-bound fields). Rule wasn't added. |
| `isCurrentGroupPotentiallyEligible` (inline comment target) | 7 matches — live. Inline comment warranted. |
| `Response` AutoCloseable wrap | No existing violations found in main code — rule is preventive. |
| `ChannelInterceptingRestHandlerDecorator` file | 255 references across 20+ ES modules — multi-module rule justified. |
| `checkSuspectedCorruptedPatchState` / `CorruptedPatchWithoutValidMetadata` | Rule originally said `DetectedPatchWithoutValidMetadata` — corrected during recheck. |

## First-use findings (skill issues worth reporting)

1. **Step 4 grep example uses `--include='*.ts' --include='*.tsx'`** — this is TypeScript-specific. For a JVM repo I swapped to `--include='*.scala' --include='*.java'`. The skill should parameterise this or provide a language-adapter note.
2. **`wait -n` in setup's `gh api` parallel loop fails on macOS bash 3.2.** (Not in the skill's code — but if setup.md ever documents a parallel-fetch helper, it needs POSIX-safe job control.)
3. **Workflow template's `scopeRules` needs deepest-first ordering.** The `first match wins` loop means `core/` must come AFTER `core/src/main/scala/.../blocks/`. The template comment doesn't call this out; I added an inline "Deepest first" comment above the array. Worth adding to the skill's template.
4. **Classification edge case — cross-ES-module rules.** A rule that applies to all 20 `esNNx/` files logically belongs at the scope that the bot will actually traverse from, which is the repo root. The skill didn't call this out as a placement rule. Documented that in the root BUGBOT.md rules I wrote.
5. **`setup.md` Step 2 lookup** — `gh pr list --limit 50` default is too low for mature repos. Task correctly overrode to `--limit 1000` but the skill should default to something higher for mature repos (or auto-scale based on total merged PR count from the initial `gh api /repos/{o}/{r}` call).
6. **`recheck` didn't catch my original `DetectedPatchWithoutValidMetadata` typo** — the rule text had the wrong name. A prose rule can't be automatically verified without NER. I caught it only because I manually re-read the source while writing MINING_LOG. A simple heuristic — extract `` `CamelCase` `` tokens from rules and grep them — would catch this class of typo.

## Summary

- 7 BUGBOT.md files
- 27 total enforceable rules
- 7 LESSONS.md entries
- 3 inline SINGLE-FILE comments (each with PR-provenance cite)
- Worst-case combined BUGBOT word count: 1,181 (target <2000 tokens).
- Every rule cites a specific PR; no `(bootstrapped — verify after usage)` tags — this is a mature repo with plenty of real corpus.
