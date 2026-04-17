# Harvest

`/pr-war-stories harvest` — process new review comments into rules. Run whenever a merged PR has produced a harvest summary, or manually to catch up.

Two modes: **A** is preferred (uses the automated workflow output); **B** is the bootstrap/catch-up mode.

## Mining order (ranked by yield)

Not all substantive comments are equal. Process them in this priority, and stop when budget runs out:

1. **Author-dismissals of bot findings** — the author wrote "Dismissed — intentional because X", "False positive because Y", "Won't fix — Z". Highest yield: the rationale is already written, locally scoped, and prevents the bot re-flagging the same line next PR. Usually → SINGLE-FILE inline comment. (See "Author-dismissal mining" below — this is the most valuable harvest step and the most commonly skipped one.)
2. **Senior reviewer critiques on adopted changes** — "you should use X instead of Y", where the PR was merged with the suggested change. → REVIEWABLE (BUGBOT.md) or EDUCATIONAL (LESSONS.md).
3. **Senior reviewer teaching moments** — "the canonical pattern is: [code block]". Usually → LESSONS.md with the exact code.
4. **Rejected suggestions** — skip. Encoded as rules, they would make the bot contradict the team.
5. **Style nits** — skip. Belong in linter config.

## Mode A: Process harvest summaries (preferred)

The `harvest-lessons.yml` workflow ([templates/harvest-lessons.yml](../templates/harvest-lessons.yml)) posts a "Lesson Harvest" comment on every merged PR with substantive human review comments.

```bash
# Find recent merged PRs with harvest summaries
gh pr list --state merged --limit 10 --json number,title,url

# Read the harvest summary for each
gh pr view {number} --comments
```

Then read the current `LESSONS.md` and every `.cursor/BUGBOT.md`. Apply the mining order above, then for each candidate comment:

### 1. Is it new?

If the rule is already covered in BUGBOT.md or LESSONS.md, skip. Broader rules subsume narrower ones (e.g., "stale closures" already covers "useCallback with empty deps"). Don't add a redundant rule.

### 2. Was it actually adopted?

Check the final merged code. Was the reviewer's suggestion accepted, or did the author push back and the team agreed the original was right?

- **Adopted** → eligible for a rule.
- **Discussed and rejected** → NOT a rule. It's a design decision. (Skipping these is non-negotiable — rejected suggestions encoded as rules will make the bot contradict the team.)
- **Ambiguous — no clear consensus** → skip. An ambiguous rule is worse than no rule.

### 3. Is it a style preference?

"Prefer early returns here", "rename this variable", "I'd extract this into a helper" — style preferences are NOT rules. They belong in linter config or team style guides.

### 4. Classify

Apply [classification.md](../reference/classification.md): REVIEWABLE / EDUCATIONAL / SINGLE-FILE / OVERLAPPING / STALE.

### 5. Place

- **REVIEWABLE** → the BUGBOT.md matching the scope listed in the harvest summary.
- **EDUCATIONAL** → LESSONS.md under the appropriate category.
- **SINGLE-FILE** → inline comment in the source file.

Apply [quality-bar.md](../reference/quality-bar.md) to the final rule — no exceptions.

### 6. Verify budget

No BUGBOT.md file over 600 words after adding. If you're pushing against the limit, something already there is probably OVERLAPPING or STALE — remove it.

### 7. Commit

One PR titled `chore: harvest lessons from PRs #X, #Y, #Z`. Keep commits small so team review of the rules themselves is tractable.

## Mode B: Manual mining

Use when bootstrapping, catching up on older PRs without harvest summaries, or the workflow isn't installed yet.

```bash
# Mine the last 30 merged PRs
gh pr list --state merged --limit 30 --json number,title
gh api repos/{owner}/{repo}/pulls/{number}/comments
```

Same classification, same placement, same priority order as Mode A. Read existing `LESSONS.md` + `.cursor/BUGBOT.md` first — dedup is the hard part.

## Author-dismissal mining (highest-yield sub-phase)

When the team runs a bot reviewer (Cursor Bugbot, CodeRabbit, Copilot Code Review), the PR author frequently replies to the bot's findings with explicit rationale: *"Dismissed — X is intentional because Y"*. These replies are pre-written rule material and should be harvested first.

### How to find them

```bash
# All author responses to bot comments containing dismissal language,
# across all PRs in window. Adjust AUTHOR to the repo's top PR authors.
gh pr list --repo <owner>/<repo> --state merged --limit 200 \
  --search "merged:>=<window-start>" \
  --json number --jq '.[].number' | \
while read -r n; do
  gh api "repos/<owner>/<repo>/pulls/$n/comments" --paginate --jq '
    .[] | select(
      (.user.login | test("(?i)^(<author1>|<author2>)$")) and
      (.body | test("(?i)(dismissed|won.t fix|false positive|intentional|by design)"))
    ) | {pr: '"$n"', file: .path, line: .line, body}
  '
done > dismissals.ndjson
```

### How to rank

A file with **≥2 dismissals** across the window is strong signal that repeated Bugbot noise is burning the author's time. Prioritise by dismissal count per file:

```bash
jq -s 'group_by(.file) | map({file: .[0].file, count: length}) | sort_by(-.count)' dismissals.ndjson
```

### How to place

Start with a Layer-3 inline comment. Copy the author's rationale into the source near the flagged line:

```javascript
// NOTE to review bots: <rationale from the dismissal — why this pattern is correct>.
// (Bugbot dismissed in PR #NNN)
```

### Promote repeated dismissals to scope-level BUGBOT.md

**If the same rationale recurs on 3+ files or the same file has 5+ dismissals**, the inline-comment approach breaks down: you'd duplicate the explanation, drift between copies, or miss files entirely. Promote instead.

Decision table:

| Pattern of dismissals | Placement |
|---|---|
| 1–2 dismissals, same file | Inline comment next to the code. |
| 3+ dismissals, same file | Scope-level BUGBOT.md in the nearest directory containing that file. Create a new BUGBOT.md if none exists. |
| Same rationale on 3+ files in one directory | Scope-level BUGBOT.md in that directory. |
| Same rationale across the whole repo | Root `.cursor/BUGBOT.md`. |

A single "rule" that captures 10 dismissals is worth more than 10 inline comments that repeat the same invariant and drift out of sync.

### Why this sub-phase matters most

- **Rationale is already written** — no interpretation needed. The author explained the invariant in prose.
- **Locally scoped** — attached to a file:line. Natural SINGLE-FILE fit.
- **Immediately preventive** — stops the bot flagging the same issue on the next PR touching that file.
- **Bounded** — dismissals-per-file caps at manageable numbers (top files in a typical repo have ≤50 dismissals total).

Skip this sub-phase only if the repo doesn't use a bot reviewer yet. Otherwise this is where the largest per-comment value is.

## Deduplication (critical for repeat runs)

Before adding any rule, check if it's already covered:

```bash
# Search all BUGBOT.md files for the key concept (handles paths with spaces)
find . -name BUGBOT.md -path '*/.cursor/*' -print0 | \
  xargs -0 grep -niH 'Promise.all\|unbounded'
```

A rule is a duplicate if:
- The same pattern is already named, even with different wording.
- A broader rule already covers it.
- The same PR number is already referenced in an existing rule.

When in doubt, DON'T add. Fewer focused rules beat more overlapping rules.
