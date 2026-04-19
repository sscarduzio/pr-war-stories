# Mining Log — pr-war-stories setup + harvest

Clean-slate measurement run on `Octostarco/octostar-api` (branch `pr-war-stories/case-study-2026-04`).

- **Skill version**: 0.7.0 (2026-04-17)
- **Window**: 500 most recent merged PRs — `#2` (2025-01-15) → `#608` (2026-04-17).
- **Run date**: 2026-04-17.

## Corpus stats

| Metric | Count |
|---|---:|
| Merged PRs in window | 500 |
| Total inline review comments | 5,128 |
| `cursor[bot]` (Bugbot) comments | 2,311 |
| GitHub `Copilot` Code Review comments | 308 |
| Human reviewers (top 8) | 2,574 |
| Substantive top-level human review comments | 535 |
| Author replies containing dismissal rationale | 1,316 |
| Top dismissal file (`apps/apps_service.py`) | 17 |

### Reviewer breakdown (top 12)

```
2311 cursor[bot]
 837 fullergalway
 585 sscarduzio
 351 fabiocorneti
 308 Copilot           ← !! note: no [bot] suffix
 280 arieledgardolevy
 141 michelecerruto
  82 VTonelli
  68 varunsharma27
  65 bebossi
  57 andreadistefano
  30 IvanCheplik
```

## Hierarchy planning (Step 3 — review-density ranking)

Top directories by substantive-human comment density (top quartile → own BUGBOT.md):

| Rank | Directory | Substantive human comments |
|---:|---|---:|
| 1 | `app/api/v1/common/` | 288 |
| 2 | `app/api/v1/ai/`     | 247 |
| 3 | `app/api/v1/apps/`   | 177 |
| 4 | `app/api/v1/entities/` | 148 |
| 5 | `app/api/v1/sets/`   |  92 |
| 6 | `app/api/v1/pipeline/` | 89 |
| 7 | `app/api/v1/files/`  |  89 |

All 7 earned a scoped `.cursor/BUGBOT.md`. Below-the-line modules (`ontology/`, `workspace/`, `archive/`) continue to inherit from root.

## Mining-order yield (Mode B)

| Tier | Source | Rules authored |
|---|---|---:|
| 1 | Author dismissals of bot findings | 14 |
| 2 | Senior reviewer critiques on adopted changes | 19 |
| 3 | Bug-fix PR teaching moments | 13 |
| 4 | Rejected suggestions | 0 (skipped) |
| 5 | Style nits | 0 (skipped) |

Total rules: 46 (14 + 19 + 13). 30% originate in author-dismissal rationales. This is close to the upper end we'd expect for a bot-reviewed repo with active authors.

## First-use findings

### 1. `.cursor/` is gitignored

`.gitignore:250` lists `.cursor/`. Bugbot files would not have been committed by default. The fix is `git add -f` for every `.cursor/BUGBOT.md`. Ideally the setup command should detect this at preflight (it does — but the user must act on it).

Decision: keep `.cursor/` in `.gitignore` (other editor state doesn't need to be tracked) and force-add only the `BUGBOT.md` files. A future enhancement could append `!.cursor/BUGBOT.md` to `.gitignore` automatically.

### 2. GitHub `Copilot` Code Review posts with NO `[bot]` suffix

308 review comments in the window were posted by user `Copilot` (login lowercase: `copilot`). Under a naive filter that matches only `<login>[bot]`, ALL 308 would be classified as human review comments. The v0.7 filter already accounts for this. Counter-example: `cursor[bot]` does have the `[bot]` suffix.

Under the pre-v0.7 filter (which only suppressed `[bot]`-suffixed logins), the substantive-human count would have been:
- Naive filter: 535 + 308 = 843
- v0.7 filter: 535

Misclassification rate under the old filter: **308/843 ≈ 36.5%** — significant enough that several rules in LESSONS.md and BUGBOT.md would have originated in Copilot critiques rather than real human review if the filter were not updated.

### 3. JDBC path retirement produced stale rules from PR history

PR #401 ("Fix JDBC column name truncation") would have produced a `getColumnLabel / getColumnName` rule, but CLAUDE.md explicitly records that the JDBC path has since been retired. Verified with `grep -r getColumnLabel app/` → zero matches. Rule dropped as STALE.

### 4. Agentic-router rewrites killed several Bugbot-dismissal rules

17 dismissals on `chat_agent.py` and 5 on `parse_entity_context.py` under `app/api/v1/ai/runnables/agentic_router/` — but `agentic_router/` no longer exists (replaced by `agentic/` and `agentic_intel/`). Those inline-comment candidates were dropped as STALE.

### 5. No AGENTS.md needed

The repo has no Cursor/Codex-IDE workflow; only Claude Code is used for IDE assistance. CLAUDE.md already wires both LESSONS.md and the hierarchical BUGBOT.md discovery. AGENTS.md would be dead weight here.

## Rule provenance (PRs cited)

Root: #573, #574, #494, #608, #350, #388, #393.
`common/`: #450, #578, #580, #585, #397, #254.
`apps/`: #329, #438, #502.
`entities/`: #117, #152, #236, #303, #397, #493, #536.
`ai/`: #214, #433, #444, and commit `9dbfc9d9`.
`sets/`: #254.
`pipeline/`: #285, #513, #597.
`files/`: #117, #298, #504.

## Recheck summary

- 7 / 7 `scopeRules` prefixes point at existing directories.
- 46 BUGBOT rules; no referenced symbol found missing on spot-checks of the high-value calls (`_get_on_cluster_clause`, `is_valid_k8s_label_value`, `ExecutionMode`, `etimbr`, `EXPLAIN` stage-5 router, `MASKED_VALUE`, `SecretMerger._is_obfuscated`, `json.JSONDecodeError` fallback, `add_workspaces_filter`, `proxy_search`).
- 2 inline comments placed (both in `apps_service.py`).
- Worst-case combined BUGBOT.md load (all 8 files): 1,965 words (~2,300 tokens) — inside budget.

## Next step

Run `/pr-war-stories audit` in 2–4 weeks.
