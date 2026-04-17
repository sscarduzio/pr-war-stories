# Recheck

`/pr-war-stories recheck` — verify rules still reference code that exists. Run after setup, harvest, big refactors, and directory renames.

A rule that flags live violations is working. A rule that references eliminated patterns is stale and must be removed.

## What recheck verifies

### 1. BUGBOT.md references

For each `.cursor/BUGBOT.md` file:

Extract every file path, function name, class name, and symbol mentioned in rule text, then search the codebase (grep / glob) to verify each still exists.

**Limitation:** rule text is prose, and extracting precise identifiers from English is brittle. If a rule describes a *pattern* rather than naming a concrete symbol (e.g., *"avoid calling query methods with unbound parameters"*), skip automated reference-checking for that rule and flag it for manual review in the report.

### 2. Inline comments

For each inline comment placed by pr-war-stories (grep for `See PR #` / `From PR #` in source comments):

- Does the comment still make sense in its current location?
- Was the surrounding code rewritten such that the invariant no longer holds?

Flag for human review. Don't auto-remove — a "stale" comment might be the last remaining memory of a constraint still in force.

### 3. `scopeRules` in the workflow

Read `scopeRules` from `.github/workflows/harvest-lessons.yml`. For each `{ prefix, scope }`:

```bash
# Directory must exist
test -d "${prefix%/}" || echo "STALE: $prefix"
```

Flag any prefix pointing at a nonexistent path.

### 4. Dead anti-patterns

For each BUGBOT.md rule warning against a specific pattern, check whether the pattern still exists in the code the rule is scoped to. Generate search roots from the BUGBOT.md locations themselves rather than hardcoding a monorepo layout:

```bash
# Directories to search = one level up from each .cursor/BUGBOT.md file
find . -name BUGBOT.md -path '*/.cursor/*' -print | \
  sed 's|/\.cursor/BUGBOT\.md$||' | sort -u > .recheck-roots

# Then grep each pattern against those roots
while read -r root; do
  grep -rn '<pattern>' "$root" --include='*.ts' --include='*.tsx' \
    --include='*.js' --include='*.py' --include='*.go' --include='*.rs' \
    --include='*.java' --include='*.rb'
done < .recheck-roots

rm -f .recheck-roots
```

Zero matches → the fix stuck; the rule is a candidate for removal (promote to [audit](audit.md) queue).

### 5. Rules never cited by the bot

A rule that has never triggered a bot comment is probably dead — either the pattern it warns about is extinct, or the rule is worded in a way the bot can't match.

```bash
# Get each rule heading from every BUGBOT.md
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 grep -H '^## ' | sed 's/^## //' > /tmp/rule-headings.txt

# Fetch the last N merged PRs' bot comments
gh pr list --state merged --limit 100 --json number --jq '.[].number' | \
  while read -r n; do
    gh api "repos/{owner}/{repo}/pulls/$n/comments" --paginate \
      --jq '.[] | select(.user.login | test("(?i)^(cursor|copilot|coderabbitai)$")) | .body // empty'
  done > /tmp/bot-comments.txt

# For each rule heading, search bot comments for distinguishing keywords
while read -r heading; do
  keyword=$(echo "$heading" | grep -oE '[A-Za-z_][A-Za-z0-9_.]+' | head -1)
  count=$(grep -c "$keyword" /tmp/bot-comments.txt 2>/dev/null || echo 0)
  printf "%4d  %s\n" "$count" "$heading"
done < /tmp/rule-headings.txt | sort -n
```

Rules at the bottom of the list (zero or near-zero bot citations over 100 PRs) → flag as "never cited." Present them in the report, noting that either:
- The pattern is extinct (confirm via Section 4 grep) → STALE, remove.
- The rule is worded in a way the bot can't detect → reword and retry, or move to LESSONS.md as educational.

This is the most honest audit of rule effectiveness: ask the bot itself whether it ever uses each rule.

## Reporting

Produce:
- Total rules checked.
- Rules with broken references (list each with the specific broken ref).
- `scopeRules` with stale prefixes.
- Inline comments near heavily-rewritten code.
- Suggested fixes per item: update path, remove rule, or promote to parent scope.

**Do NOT auto-fix.** A "missing" reference might mean the rule should be *promoted* to a broader scope (because the specific symbol was absorbed into a shared helper), not *deleted*. Let the human decide.
