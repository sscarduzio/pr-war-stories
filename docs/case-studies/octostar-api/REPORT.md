# Case study — octostar-api

**Target repo:** `Octostarco/octostar-api` — private FastAPI/Python backend for the Octostar knowledge-graph platform. LangChain-based AI, ClickHouse / OpenSearch / MySQL, Kubernetes deploys.

**Ran on:** 2026-04-17. Clean-slate measurement run on branch `pr-war-stories/case-study-2026-04`.

## Corpus

| Metric | Value |
|---|---|
| PR window | 500 most recent merged PRs (#2 → #608) |
| Total inline review comments | 5,128 |
| Cursor Bugbot (`cursor[bot]`) comments | 2,311 |
| **GitHub Copilot Code Review comments (no `[bot]` suffix!)** | **308** |
| Substantive top-level human review comments | 535 |
| Author-dismissal rationales surfaced | 1,316 |

## What the skill produced

### 8 BUGBOT.md files, 46 rules

| File | Rules | Words |
|---|---|---|
| `.cursor/BUGBOT.md` (root) | 7 | 326 |
| `app/api/v1/common/.cursor/BUGBOT.md` | 7 | 310 |
| `app/api/v1/ai/.cursor/BUGBOT.md` | 6 | 232 |
| `app/api/v1/apps/.cursor/BUGBOT.md` | 7 | 316 |
| `app/api/v1/entities/.cursor/BUGBOT.md` | 6 | 247 |
| `app/api/v1/sets/.cursor/BUGBOT.md` | 4 | 166 |
| `app/api/v1/pipeline/.cursor/BUGBOT.md` | 5 | 193 |
| `app/api/v1/files/.cursor/BUGBOT.md` | 4 | 175 |

Worst-case bot-traversal load (root + `common/` + deepest submodule combined): **1,965 words** — just under the <2000-token target.

### LESSONS.md — 10 entries

With real `WRONG` / `RIGHT` Python blocks and PR citations.

### 2 inline SINGLE-FILE comments

Both in `app/api/v1/apps/apps_service.py` (the file with the most dismissals).

## Cost

| Metric | Value |
|---|---|
| Wall-clock time | **~12 minutes** end-to-end |
| Total tokens (input + output, all tool turns) | **138,899** |
| `gh` API calls | **501** (1 PR-list + 500 per-PR comments) |
| Files written | 11 new + 2 source edits + 1 `.gitignore` entry |

Approximate Sonnet 4.6 cost: **~$0.25–0.60** (depending on cache hit rate).

## Notable findings

### 1. Copilot filter catches a 36.5% false-human rate

GitHub's Copilot Code Review bot posts as login `Copilot` — no `[bot]` suffix. Of 843 "apparently human" comments, **308 (36.5%) are Copilot bot noise**. The old skill filter (pre-v0.7) would have misclassified every one of these as substantive human review input, producing junk harvest proposals.

The v0.7 filter (case-insensitive `copilot`, `coderabbitai`, `cursor`) correctly excludes them. This case study is the strongest empirical evidence of the bug fix shipping correctly.

### 2. Author-dismissals produced 30% of rules

14 of 46 BUGBOT rules trace directly to author dismissals of Bugbot findings. Concentrated in `apps/` (K8s-lifecycle false-positives).

### 3. `.cursor/` was gitignored

The repo's `.gitignore:250` excludes `.cursor/`. Preflight detected it; all 8 BUGBOT.md files had to be committed with `git add -f`. **Suggestion**: setup should offer to append `!.cursor/BUGBOT.md` to `.gitignore` automatically.

### 4. Stale dismissals correctly dropped

17 dismissals referenced `agentic_router/` code that was replaced by `agentic/` + `agentic_intel/`. A rule about `getColumnLabel/getColumnName` (PR #401) targeted the retired JDBC adapter — the symbol no longer exists anywhere. All dropped as STALE via the classification pre-gate.

## Full artifacts

All 12 files in this directory. MINING_LOG.md has the full reviewer breakdown, hierarchy decisions, rules-dropped rationale, and live-pattern verification.
