# Setup

`/pr-war-stories setup` — bootstrap the full system for a new repository. Run once per repo.

## Step 0: Preflight (MANDATORY — run first)

Before anything else, verify the environment. If any check fails, stop and report to the user before proceeding.

```bash
# gh CLI must be authenticated — the skill can't mine PRs otherwise.
gh auth status

# .cursor/ must not be gitignored — otherwise BUGBOT.md files won't be committed.
grep -rn '\.cursor' .gitignore .cursorignore 2>/dev/null

# git history must be present and the default branch known.
git rev-parse --abbrev-ref HEAD
git log --oneline -1
```

If `.cursor` is gitignored, ask the user whether to remove the ignore or use an alternate path (the default Cursor Bugbot behaviour requires `.cursor/BUGBOT.md`).

## Step 1: Discover repository structure

Understand what you're working with before mining anything.

- Monorepo layout? (`apps/`, `packages/`, `services/` — or flat?)
- Frameworks and languages in use.
- State-management approach (relevant for frontend rules).
- Existing AI config files: `.cursor/`, `CLAUDE.md`, `AGENTS.md`, `.cursorrules`.
- CI/CD running on PRs (look in `.github/workflows/`).
- Is Cursor Bugbot already active? Check recent PR comments for author `cursor` or `cursor[bot]`.

Record the findings — Step 3 needs them.

## Step 2: Mine PR history for war stories

**If the repo has fewer than 10 merged PRs with review comments,** skip mining and bootstrap from code reading instead: look for `TODO` / `FIXME` / `HACK` comments, complex functions without tests, and recent `git blame` hotspots. Rules created this way must be tagged `(bootstrapped — verify after usage)` per [quality-bar.md](../reference/quality-bar.md).

**For mature repos (>100 merged PRs),** mine deeper. The first 50 PRs yield the obvious wins; PRs 50–200 yield more architectural lessons. Use `--limit 200` for long history.

```bash
# List recent merged PRs
gh pr list --state merged --limit 50 --json number,title,body,mergedAt

# For each promising PR (bug fixes, "fix" in title, many review comments):
gh api repos/{owner}/{repo}/pulls/{number}/comments   # inline review comments
gh api repos/{owner}/{repo}/pulls/{number}/reviews     # review summaries
gh pr view {number} --comments                         # general comments
```

### What to look for (priority order)

**TOP TIER — human review comments explaining WHY something is wrong:**
- "This broke before when…"
- "Be careful because…"
- Race conditions, edge cases, non-obvious side effects.

**HIGH VALUE — bug-fix PRs:**
- What pattern caused the regression?
- What was the root cause not obvious from the code?

**MEDIUM VALUE — design decisions:**
- Alternatives discussed and rejected.
- New patterns the team agreed to follow.

Skip: LGTM comments, style nits ("rename this variable"), and rejected suggestions.

## Step 3: Plan the BUGBOT.md hierarchy

Map repo structure to BUGBOT.md files.

```
.cursor/BUGBOT.md                              ← global (every PR)
apps/app-a/.cursor/BUGBOT.md                   ← app-specific
apps/app-a/src/complex-module/.cursor/BUGBOT.md ← module-specific (only if warranted)
apps/app-b/.cursor/BUGBOT.md                   ← app-specific
packages/.cursor/BUGBOT.md                     ← shared packages
```

### Rank by review-comment density, not by perceived complexity

"Genuinely complex" is subjective and usually wrong. A module that *feels* tricky to the person setting up the skill may not be the one the team actually debates. The objective signal is **where review comments land**. Before choosing module-level scopes, rank directories by substantive review-comment density from Step 2's mined data:

```bash
# Group substantive review comments by top-3 directory depth, count them
jq -r '.[] | select(.path != null) | .path' comments/*.json 2>/dev/null | \
  awk -F/ 'NF>=3 {print $1"/"$2"/"$3}' | \
  sort | uniq -c | sort -rn | head -20
```

Rule of thumb: directories in the **top quartile of comment volume** earn their own BUGBOT.md. Directories nobody reviews don't. Expect this to contradict your intuition at least once — trust the data.

### Design rules

- **Root file** — cross-cutting concerns only (universal gotchas, cross-app impact).
- **App files** — framework patterns, state management, config quirks specific to that app.
- **Module files** — warrant their own scope when review-comment density is in the repo's top quartile AND the rules would not apply to sibling modules. Don't make one per directory.
- **Package files** — API contract rules, export stability, dependency boundaries.

Record the list of BUGBOT.md locations — Step 6 needs it to populate `scopeRules` in the workflow.

## Step 4: Verify and write the rules

**Before writing any rule**, verify the referenced code still exists:

```bash
grep -rn 'functionName\|patternName' apps/ packages/ --include='*.ts' --include='*.tsx' -l
```

Skip rules for code that was refactored, renamed, or deleted. A rule pointing at phantom code is worse than no rule — it confuses the bot.

For each verified war story, write a BUGBOT.md rule using the format + quality bar in [quality-bar.md](../reference/quality-bar.md). Classify each rule against [classification.md](../reference/classification.md) — REVIEWABLE rules land here; EDUCATIONAL and SINGLE-FILE go to LESSONS.md and inline comments respectively.

## Step 5: Create LESSONS.md

Distill war stories that didn't fit BUGBOT.md into universal engineering lessons.

Apply [quality-bar.md](../reference/quality-bar.md) section "LESSONS.md entries" — every lesson needs a `# WRONG` / `# RIGHT` block. Drop aggressively: 8 concrete lessons beat 15 vague ones.

Good categories: Database & ORM, Data Model & Serialization, External Services & APIs, Deployment & Infrastructure, AI / LLM, Configuration.

## Step 6: Install the automated harvest workflow

Copy the template:

```bash
mkdir -p .github/workflows
cp templates/harvest-lessons.yml .github/workflows/
```

Then edit `.github/workflows/harvest-lessons.yml` and populate the `scopeRules` array. Generate one entry per BUGBOT.md file from Step 3:

```js
// apps/frontend/.cursor/BUGBOT.md  →
{ prefix: 'apps/frontend/', scope: 'frontend' },
```

The `prefix` is the directory containing the `.cursor/BUGBOT.md` (include trailing slash). The `scope` is a short identifier used in the harvest summary posted on PRs.

Other per-repo edits:
- `botLogins` — add any repo-specific bots (e.g., internal CI accounts).
- `branches: [main]` — change if your default branch differs.

## Step 7: Wire up discovery

LESSONS.md is useless if AI assistants don't know to read it.

**CLAUDE.md** (Claude Code reads this automatically):

```bash
if [ -f CLAUDE.md ]; then
  grep -qi 'LESSONS.md' CLAUDE.md && echo "ok" || echo "needs update"
else
  echo "missing"
fi
```

If CLAUDE.md exists but doesn't reference LESSONS.md, add near the top:

```markdown
**Before writing or reviewing code, read [`LESSONS.md`](LESSONS.md)** — hard-won engineering lessons from real bugs and PR reviews.
```

If CLAUDE.md doesn't exist, create a minimal one with that same line under a `# Project Name` heading.

**AGENTS.md** (Cursor / Codex reads this): same check, same pointer.

**Do NOT skip this step.** Without the pointer, the IDE assistant won't read LESSONS.md and developers won't benefit from Layer 2 of the architecture.

## Step 8: Verify token budget

```bash
# Words per file
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 -I{} sh -c 'printf "%-60s %4d words\n" "{}" $(wc -w < "{}")'

# Worst case: all BUGBOT.md files a deep-nested PR would load
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | xargs -0 cat | wc -w
```

Any single file over 600 words? Audit it against [classification.md](../reference/classification.md) — likely contains OVERLAPPING or STALE rules.

## Step 9: Recheck + report

Read [`recheck.md`](recheck.md) and execute it inline as the final sub-step of setup — do not instruct the user to "run it later." Rules mined from old PRs often reference already-fixed patterns, and recheck catches those before they ship.

After recheck completes, generate the summary by running these counts (do NOT hand-count):

```bash
# Number of BUGBOT.md files
find . -name BUGBOT.md -path '*/.cursor/*' -print | wc -l

# Total rules across all BUGBOT.md files (handles paths with spaces)
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 grep -c '^## ' | awk -F: '{s+=$2} END {print s}'

# Number of lessons in LESSONS.md
grep -c '^### ' LESSONS.md 2>/dev/null || echo 0
```

Output a formatted summary. End with: *"Next: run /pr-war-stories audit in 2–4 weeks."*
