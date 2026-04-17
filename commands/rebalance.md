# Rebalance

`/pr-war-stories rebalance` — promote under-scoped hotspot directories, demote cold-scoped modules. Run after 3+ months of real review activity, or any time the `audit` command surfaces hierarchy mismatches.

This is the honest-to-the-data version of Setup Step 3 ("Plan the BUGBOT.md hierarchy"), run on evidence instead of intuition. Setup's hierarchy is almost always wrong at first — the skill's guess about "genuinely complex modules" consistently mismatches where the team actually debates code.

## When to run

- After every `audit` that reports a hierarchy mismatch.
- When a previously-sleepy module becomes a review hotspot (rewrites, new team, shifted focus).
- When a module is split, merged, or deleted — the scope map must follow.
- **NOT** during initial setup. You need several months of review data; without it, there's nothing to rebalance against.

## Procedure

### 1. Gather the density map

```bash
# Mine substantive (non-bot) review comments from the last 200 PRs
gh pr list --state merged --limit 200 --json number --jq '.[].number' | \
while read -r n; do
  gh api "repos/{owner}/{repo}/pulls/$n/comments" --paginate \
    --jq '.[] | select(
      (.user.login | ascii_downcase) as $l |
      ($l | endswith("[bot]") | not) and
      ([$l] | inside(["cursor","copilot","coderabbitai","github-actions","dependabot","renovate","codecov"]) | not)
    ) | .path // empty'
done > /tmp/paths.txt

# Rank by 4-deep directory (tune the `NF>=N` to match repo depth)
awk -F/ 'NF>=4 {print $1"/"$2"/"$3"/"$4}' /tmp/paths.txt | \
  sort | uniq -c | sort -rn > /tmp/density.txt

# List existing BUGBOT.md scopes
find . -name BUGBOT.md -path '*/.cursor/*' -print | \
  sed 's|/\.cursor/BUGBOT\.md$||' | sort > /tmp/scopes.txt

cat /tmp/density.txt
```

### 2. Identify candidates

**Promote candidates** — directories in the top quartile of density with no matching BUGBOT.md.

**Demote candidates** — existing BUGBOT.md scopes whose directory doesn't appear in the top-density list (or appears very low).

Typical signatures:
- A cold scope with ≤2 rules that never gets cited in bot reviews → demote its rules into the parent scope and delete the BUGBOT.md.
- A hot directory (top-5 density) with no scope → create a BUGBOT.md, then run `/pr-war-stories harvest` scoped to the PRs that landed rules on that directory.

### 3. Execute the promotions

For each directory to promote:

```bash
# Create the new scope
mkdir -p <path>/.cursor
```

Then read [`add-module.md`](add-module.md) and execute inline with `<path>` = the promoted directory. The goal: write a BUGBOT.md with rules mined from the 30+ review comments that directory has already accumulated.

Also update `.github/workflows/harvest-lessons.yml`'s `scopeRules` array to include the new scope (see [`add-module.md`](add-module.md) step 5).

### 4. Execute the demotions

For each cold BUGBOT.md to demote:

1. Read its rules.
2. For each rule, decide: does it belong in the parent scope, or is it dead (STALE)?
3. Move the keepers into the parent BUGBOT.md (append, then run Dedup from [`harvest.md`](harvest.md)).
4. Delete the cold `.cursor/BUGBOT.md` and its directory if empty.
5. Remove the corresponding entry from `scopeRules` in the workflow.

### 5. Recheck

Read [`recheck.md`](recheck.md) and execute inline. Every moved rule's references must still resolve in the new scope. Every removed scope must be gone from the workflow.

### 6. Commit

One PR titled `chore: rebalance BUGBOT.md hierarchy (promote X, demote Y)`. In the description, include the density map from Step 1 and the rationale per move. This is exactly the kind of change that benefits from human review — the team may have context about why a cold scope was created that the density data doesn't show.

## What this command does NOT do

- Does not add new rules. If rebalancing surfaces missing rules, run `/pr-war-stories harvest` afterward.
- Does not auto-delete anything. Deletions are always proposed, never executed silently.
- Does not respect `git blame` or commit archaeology — it treats the current codebase as the source of truth.
