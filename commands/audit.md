# Audit

`/pr-war-stories audit` — measure rule effectiveness and optimize. Run quarterly.

## 1. Measure

Check the last 20 Bugbot-reviewed PRs:

```bash
gh pr list --state merged --limit 20 --json number,title
gh api repos/{owner}/{repo}/pulls/{number}/reviews
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

For each Bugbot comment, classify:
- **USEFUL** — caught a real issue or gave project-specific feedback.
- **NOISE** — generic advice the developer already knew.
- **MISS** — human reviewer caught something Bugbot should have.

Report:
1. **Hit rate** (useful / total)
2. **Rules that produced useful comments** — keep.
3. **Rules that never triggered** — candidates for removal.
4. **Human catches** — encode as new rules ([harvest.md](harvest.md)).

## 2. Optimize

Re-classify every rule against [classification.md](../reference/classification.md):

- **REVIEWABLE** → confirm it's in BUGBOT.md; move if misplaced.
- **EDUCATIONAL** → confirm it's in LESSONS.md; move if misplaced.
- **SINGLE-FILE** → confirm it's an inline comment; move if misplaced.
- **OVERLAPPING** → merge into the broader rule.
- **STALE** → remove.

Cross-reference [graduation.md](../reference/graduation.md) — actively look for rules that have matured into lint-able patterns and graduate them out of BUGBOT.md into CI. **Shrinking BUGBOT.md is a health signal.**

## 3. Audit bootstrapped rules

Find rules tagged `(bootstrapped — verify after usage)`. Grep the parenthesised form so prose mentions of the word "bootstrapped" don't false-positive:

```bash
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 grep -nH '(bootstrapped'
```

For each:
- Has it caught at least one real issue in a bot review since being written? → remove the `(bootstrapped — verify after usage)` tag; it's battle-tested now.
- Never triggered, or only on false positives? → remove the rule.

**When to give up on a bootstrapped rule:** use volume, not just time. The rule has had enough opportunity to fire when the repo has merged at least **30 PRs** since the rule was added, OR **3 months** have passed — whichever is later. On low-traffic repos 3 months isn't enough evidence; on high-traffic repos 30 PRs comes faster. Use the later of the two thresholds.

## 4. Rebalance the hierarchy

The initial setup's guess at which modules deserve their own BUGBOT.md is often wrong. Once there's 3+ months of data, rebalance against real review activity.

### Find under-scoped hotspots

Directories with heavy review-comment density but no BUGBOT.md of their own:

```bash
# Mine the last 200 PRs for review-comment paths, group by top-3 directory
gh pr list --state merged --limit 200 --json number --jq '.[].number' | \
while read -r n; do
  gh api "repos/{owner}/{repo}/pulls/$n/comments" --paginate \
    --jq '.[] | select(.user.login | test("(?i)^(cursor|copilot|coderabbitai)$") | not) | .path // empty'
done 2>/dev/null | \
  awk -F/ 'NF>=3 {print $1"/"$2"/"$3}' | sort | uniq -c | sort -rn > /tmp/density.txt

# List BUGBOT.md scopes currently installed
find . -name BUGBOT.md -path '*/.cursor/*' -print | \
  sed 's|/\.cursor/BUGBOT\.md$||' | sort > /tmp/scopes.txt

# Directories in top quartile of density but without their own BUGBOT.md
```

Any directory in the top quartile of review-comment density without a matching BUGBOT.md is a candidate for promotion to its own scope. Running `/pr-war-stories add-module <path>` on the top 1-2 offenders is usually higher ROI than adding more rules to an existing file.

### Find over-scoped cold spots

The inverse: directories that got their own BUGBOT.md at setup but never accumulate review comments. If a module BUGBOT.md is untouched by review traffic, its rules either aren't firing or the module isn't being debated. Audit candidates for demotion — fold their rules into the parent scope.

## 5. Verify budget

```bash
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 -I{} sh -c 'printf "%-60s %4d words\n" "{}" $(wc -w < "{}")'
```

Any file over 600 words indicates the cleanup didn't go far enough.
