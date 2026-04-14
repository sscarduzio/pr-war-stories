---
name: pr-war-stories
description: Build a self-improving AI code review system from PR history. Mines merged PRs for human review comments and bug-fix lessons, creates hierarchical Cursor Bugbot rules (.cursor/BUGBOT.md), universal engineering lessons (LESSONS.md), inline code comments, and a GitHub Action that auto-harvests review comments on merge. Activate on 'war stories', 'bugbot rules', 'review rules', 'pr lessons', 'teach bugbot', 'ai review setup', 'harvest lessons', 'mine PRs', 'code review rules'. Use when setting up or maintaining AI-assisted PR review for any repository.
allowed-tools: Read,Write,Edit,Glob,Grep,Bash,Agent,WebFetch,WebSearch
---

# PR War Stories: AI Code Review Knowledge System

Builds a self-improving AI code review pipeline by extracting institutional knowledge from PR history and encoding it where review bots can use it. Includes an automated GitHub Action that surfaces harvest candidates on every merged PR.

## When to Use

- `/pr-war-stories setup` -- Bootstrap the full system for a new repository
- `/pr-war-stories harvest` -- Process harvest summaries or mine PRs manually
- `/pr-war-stories audit` -- Measure rule effectiveness and optimize (run quarterly)
- `/pr-war-stories add-module <path>` -- Add rules for a new codebase module

## Core Concepts

### The Three-Layer Knowledge Architecture

Rules go where they're most effective:

1. **`.cursor/BUGBOT.md` files** -- Project-specific rules the review bot checks against diffs. Hierarchical: bot traverses upward from each changed file, collecting all BUGBOT.md files it finds. Only include rules the bot can ENFORCE on a diff.

2. **`LESSONS.md`** -- Universal engineering lessons read by IDE assistants (Claude Code, Cursor). Educational rules that can't be checked against a diff but inform how developers write code.

3. **Inline code comments** -- Rules that apply to exactly ONE file or function. Placed in the source code itself so the bot sees them whenever that file is in the diff.

### The Automated Feedback Loop

The system includes a GitHub Action (`harvest-lessons.yml`) that closes the feedback loop:

```
PR merged to main
      |
      v
harvest-lessons.yml fires automatically
      |
      v
Extracts substantive human review comments
(filters bots, skips "LGTM", maps to BUGBOT.md scopes)
      |
      v
Posts structured summary on the merged PR:
  - All review comments worth capturing
  - Affected BUGBOT.md scopes
  - Instructions to run /pr-war-stories harvest
      |
      v
Developer runs /pr-war-stories harvest (processes the summary)
      |
      v
Rules updated in BUGBOT.md / LESSONS.md / inline comments
```

This means no knowledge falls through the cracks. Every merged PR with substantive human review comments automatically produces a harvest proposal.

### Rule Classification (Critical)

Every rule must be classified before placement:

- **REVIEWABLE** -- Bot can check this against a diff. Example: "Don't use Promise.all on unbounded arrays." Goes in BUGBOT.md.
- **EDUCATIONAL** -- Informative but bot can't enforce. Example: "Build order requires packages before apps." Goes in LESSONS.md.
- **SINGLE-FILE** -- Applies to one file/function only. Example: "This adapter uses reference equality intentionally." Goes as inline comment.
- **OVERLAPPING** -- Says the same thing as another rule. Merge.
- **STALE** -- Pattern was fixed or code changed. Remove.

### Token Budget Discipline

Fewer rules = more attention per rule. Targets per BUGBOT.md file:

- Under 400 words per file (ideal)
- Under 600 words (acceptable)
- Over 800 words (too fat -- audit and slim down)

Worst-case token load (deepest nesting, 3 files combined) should stay under 2000 tokens.

## Phase 1: Setup (`/pr-war-stories setup`)

Run this in any repository with git history and a GitHub remote.

### Step 1: Discover Repository Structure

```
Explore the repository:
- What's the monorepo/project structure?
- What frameworks and languages are used?
- What's the state management approach?
- Are there existing AI config files? (.cursor/, CLAUDE.md, AGENTS.md, .cursorrules)
- What CI/CD runs on PRs? (check .github/workflows/)
- Is Cursor Bugbot already active? (check recent PR comments for "cursor" author)
```

### Step 2: Mine PR History for War Stories

**If the repo has fewer than 10 merged PRs with review comments**, skip mining and bootstrap from code reading instead: look for TODO/FIXME/HACK comments, complex functions with no tests, and recent git blame hotspots. Create rules from what you observe in the code.

Use GitHub CLI to extract institutional knowledge:

```bash
# List recent merged PRs
gh pr list --state merged --limit 50 --json number,title,body,mergedAt

# For each promising PR (bug fixes, ones with "fix" in title):
gh api repos/{owner}/{repo}/pulls/{number}/comments  # inline review comments
gh api repos/{owner}/{repo}/pulls/{number}/reviews    # review summaries
gh pr view {number} --comments                        # general comments
```

**What to look for (priority order):**

TOP TIER -- Human review comments that explain WHY something is wrong:
- "This broke before when..."
- "Be careful because..."
- Race conditions, edge cases, non-obvious side effects

HIGH VALUE -- Bug fix PRs:
- What pattern caused the regression?
- What was the root cause that isn't obvious from the code?

MEDIUM VALUE -- Design decisions:
- Alternatives discussed and rejected
- New patterns the team should follow

### Step 3: Plan the BUGBOT.md Hierarchy

Map the repository structure to determine where BUGBOT.md files should go:

```
.cursor/BUGBOT.md                              <-- global (every PR)
apps/app-a/.cursor/BUGBOT.md                   <-- app-specific
apps/app-a/src/complex-module/.cursor/BUGBOT.md <-- module-specific (optional)
apps/app-b/.cursor/BUGBOT.md                   <-- app-specific
packages/.cursor/BUGBOT.md                     <-- shared packages
```

**Rules for hierarchy design:**
- Root file: cross-cutting concerns only (cross-app impact, universal gotchas)
- App files: framework patterns, state management, config quirks
- Module files: only for genuinely complex modules with unique constraints
- Package files: API contract rules, export stability, dependency boundaries
- Don't create a file for every directory -- only where there are real war stories

### Step 4: Verify and Write the Rules

**Before writing any rule**, verify the referenced code still exists:

```bash
# For each war story that references a file, function, or pattern:
grep -r "functionName\|patternName" apps/ packages/ --include="*.ts" --include="*.tsx" -l
```

Skip rules for code that was since refactored, renamed, or deleted. A rule pointing at phantom code is worse than no rule -- it confuses the bot.

For each verified war story, write a BUGBOT.md rule:

```markdown
## Short Imperative Heading

1-3 sentences: what the rule is, what goes wrong if violated, and what to do instead.
Reference specific file paths and function names when relevant.
```

**If a rule was bootstrapped from code reading** (not from a PR war story), tag it:

```markdown
## Tiptap Editor Lifecycle (bootstrapped -- verify after usage)
```

This tells the auditor: "this rule is an educated guess, not a battle-tested lesson. Re-evaluate after a few months."

**Quality bar:**
- Actionable: bot can check it against a diff
- Specific: references real patterns, not generic advice
- Surprising: not obvious to a competent developer
- Concise: under 50 words per rule
- Verified: referenced code actually exists in the current codebase

### Step 5: Create LESSONS.md

**Note on cross-layer duplication:** Some lessons may appear in both BUGBOT.md and LESSONS.md (e.g., "JSON.stringify drops undefined"). This is intentional -- they serve different consumers (bot vs IDE assistant). During audit, update both or remove from both.

Distill war stories into universal engineering lessons:

```markdown
# Engineering Lessons Learned

## Category Name

### Bold rule statement
2-3 sentences explaining why. Enough context for someone unfamiliar
with the specific bug to understand the general principle.
```

Good categories: State & Timing, Serialization & APIs, Shared Code & CSS, Architecture & Design, Concurrency & Performance, API Contracts & Boundaries.

### Step 6: Install the Automated Harvest Workflow

Create `.github/workflows/harvest-lessons.yml` -- a GitHub Action that fires on every PR merge to main:

```yaml
name: Harvest PR Lessons

on:
  pull_request:
    types: [closed]
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  harvest:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Extract review lessons
        uses: actions/github-script@v7
        with:
          script: |
            const pr = context.payload.pull_request;
            const owner = context.repo.owner;
            const repo = context.repo.repo;
            const prNumber = pr.number;

            // Fetch inline review comments and general PR comments
            const reviewComments = await github.paginate(
              github.rest.pulls.listReviewComments,
              { owner, repo, pull_number: prNumber }
            );
            const issueComments = await github.paginate(
              github.rest.issues.listComments,
              { owner, repo, issue_number: prNumber }
            );

            // Filter to human-only (exclude known bots)
            const botLogins = new Set([
              'github-actions', 'github-actions[bot]',
              'changeset-bot', 'cursor', 'dependabot', 'dependabot[bot]',
              'codecov', 'codecov[bot]', 'renovate', 'renovate[bot]'
            ]);
            const isHuman = (c) => c.user && !botLogins.has(c.user.login) && !c.user.login.endsWith('[bot]');

            const humanReviewComments = reviewComments.filter(isHuman);
            const humanIssueComments = issueComments.filter(isHuman);

            // Filter to substantive comments (skip "LGTM", short approvals)
            const isSubstantive = (body) => {
              if (!body || body.trim().length < 40) return false;
              if (/^(lgtm|looks good|nice|thanks|ty|approved|shipit)[.!]?\s*$/i.test(body.trim())) return false;
              const lines = body.trim().split('\n');
              if (lines.every(l => !l.trim() || /^\s*-\s*\[[ x]\]/.test(l.trim()))) return false;
              return true;
            };

            const substantiveReviews = humanReviewComments.filter(c => isSubstantive(c.body));
            const substantiveIssue = humanIssueComments.filter(c => isSubstantive(c.body));

            // Skip if no substantive comments
            if (substantiveReviews.length === 0 && substantiveIssue.length === 0) {
              console.log('No substantive human comments. Skipping.');
              return;
            }

            // Count Bugbot comments for comparison
            const bugbotComments = reviewComments.filter(c => c.user && (c.user.login === 'cursor' || c.user.login === 'cursor[bot]'));

            // Map changed files to BUGBOT.md scopes
            const files = await github.paginate(
              github.rest.pulls.listFiles,
              { owner, repo, pull_number: prNumber }
            );

            // CUSTOMIZE: generate these from the repo's actual directory structure
            // during setup. Match each path prefix to its .cursor/BUGBOT.md scope.
            // Example for a monorepo:
            //   { prefix: 'apps/frontend/', scope: 'frontend' },
            //   { prefix: 'apps/backend/', scope: 'backend' },
            //   { prefix: 'packages/', scope: 'packages' },
            // Example for a single-app repo:
            //   { prefix: 'src/components/editor/', scope: 'editor' },
            //   { prefix: 'src/', scope: 'app' },
            const scopeRules = [
              // REPLACE with actual paths from Step 3
            ];

            const affectedScopes = new Set(['global']);
            for (const f of files) {
              for (const rule of scopeRules) {
                if (f.filename.startsWith(rule.prefix)) {
                  affectedScopes.add(rule.scope);
                  break;
                }
              }
            }

            // Build and post the harvest summary
            let body = `## Lesson Harvest for PR #${prNumber}\n\n`;
            body += `**${substantiveReviews.length}** inline review + **${substantiveIssue.length}** general human comments.`;
            body += ` Bugbot posted **${bugbotComments.length}** comments.\n`;
            body += `Scopes: ${[...affectedScopes].map(s => '`' + s + '`').join(', ')}\n\n`;

            body += `### Review Comments\n\n`;
            for (const c of substantiveReviews.slice(0, 10)) {
              const file = c.path || 'unknown';
              const line = c.line || c.original_line || '?';
              const text = c.body.length > 300 ? c.body.slice(0, 300) + '...' : c.body;
              body += `**${c.user.login}** on \`${file}:${line}\`:\n`;
              body += `> ${text.replace(/\n/g, '\n> ')}\n\n`;
            }
            for (const c of substantiveIssue.slice(0, 5)) {
              const text = c.body.length > 300 ? c.body.slice(0, 300) + '...' : c.body;
              body += `**${c.user.login}**: ${text.replace(/\n/g, '\n> ')}\n\n`;
            }

            body += `---\n**Next:** run \`/pr-war-stories harvest\` to classify and commit.\n`;

            await github.rest.issues.createComment({
              owner, repo, issue_number: prNumber, body
            });
```

**What to customize per repo:**
- `scopeRules` array: adjust path prefixes to match your directory structure
- `botLogins` set: add any repo-specific bots
- `branches: [main]`: change if your default branch differs

### Step 7: Wire Up Discovery

LESSONS.md is useless if AI assistants don't know to read it. This step ensures the pointer exists.

**For CLAUDE.md** (Claude Code reads this automatically):

```bash
# Check if CLAUDE.md exists and already references LESSONS.md
if [ -f CLAUDE.md ]; then
  grep -qi 'LESSONS.md' CLAUDE.md && echo "CLAUDE.md already references LESSONS.md" || echo "NEEDS UPDATE"
else
  echo "NO CLAUDE.md FOUND"
fi
```

If CLAUDE.md exists but doesn't reference LESSONS.md, add this line near the top (after the first heading):

```markdown
**Before writing or reviewing code, read [`LESSONS.md`](LESSONS.md)** -- hard-won engineering lessons from real bugs and PR reviews.
```

If CLAUDE.md doesn't exist, create a minimal one:

```markdown
# Project Name

**Before writing or reviewing code, read [`LESSONS.md`](LESSONS.md)** -- hard-won engineering lessons from real bugs and PR reviews.
```

**For AGENTS.md** (Cursor/Codex reads this):

```bash
if [ -f AGENTS.md ]; then
  grep -qi 'LESSONS.md' AGENTS.md && echo "AGENTS.md already references LESSONS.md" || echo "NEEDS UPDATE"
fi
```

If it exists and doesn't reference LESSONS.md, add the same pointer line.

**Do NOT skip this step.** Without these pointers, the IDE assistant won't read LESSONS.md and developers won't benefit from the upstream filter (Layer 2 of the architecture).

### Step 8: Verify Token Budget

```bash
# Count words per scenario
for f in $(find . -name BUGBOT.md -path '*/.cursor/*'); do
  printf "%-60s %4d words\n" "$f" $(wc -w < "$f")
done

# Worst case: deepest nesting
cat $(find . -name BUGBOT.md -path '*/.cursor/*' | sort) | wc -w
```

If any single file exceeds 600 words, audit it using the classification system.

### Step 9: Print Summary Report

After setup is complete, auto-generate the summary by running these counts (do NOT hand-count):

```bash
# Count files and rules
echo "BUGBOT.md files:" && find . -name BUGBOT.md -path '*/.cursor/*' | wc -l
echo "Total rules:" && grep -c '^## ' $(find . -name BUGBOT.md -path '*/.cursor/*') | awk -F: '{s+=$2} END {print s}'
echo "LESSONS.md lessons:" && grep -c '^### ' LESSONS.md

# Token budget per file
for f in $(find . -name BUGBOT.md -path '*/.cursor/*' | sort); do
  printf "%-60s %4d words\n" "$f" $(wc -w < "$f")
done

# Worst case
echo "Worst case:"
cat $(find . -name BUGBOT.md -path '*/.cursor/*' | sort | head -3) | wc -w

# Bootstrapped count (from actual files, not memory)
echo "Bootstrapped rules:" && grep -rc 'bootstrapped' $(find . -name BUGBOT.md -path '*/.cursor/*') | awk -F: '$2>0 {s+=$2} END {print s+0}'
```

Then output the results as a formatted summary. End with: "Next: run /pr-war-stories audit in 2-4 weeks."

### Step 0: Preflight Checks

Before starting, verify:

```bash
# Ensure .cursor/ is not gitignored
grep -r '\.cursor' .gitignore .cursorignore 2>/dev/null
# If found, the BUGBOT.md files won't be committed. Remove the ignore or use a different path.

# Ensure gh CLI is authenticated
gh auth status
```

## Phase 2: Harvest (`/pr-war-stories harvest`)

Two modes: processing automated harvest summaries, or manual mining.

### Mode A: Process Harvest Summaries (preferred)

If the `harvest-lessons.yml` workflow is installed, merged PRs with substantive human review comments will have a "Lesson Harvest" comment posted automatically.

```
Check recent merged PRs for harvest summary comments:

  gh pr list --state merged --limit 10 --json number,title,url

For each PR with a harvest summary, read the comments:

  gh pr view {number} --comments

Then read the existing LESSONS.md and .cursor/BUGBOT.md files.

For each review comment in the harvest summary:
1. Is this a new lesson not already covered? If no, skip.
2. Classify: REVIEWABLE / EDUCATIONAL / SINGLE-FILE
3. Place in the correct location:
   - REVIEWABLE: add to the BUGBOT.md file matching the scope listed in the harvest
   - EDUCATIONAL: add to LESSONS.md under the appropriate category
   - SINGLE-FILE: add as an inline code comment in the source file
4. Verify token budget (no BUGBOT.md file over 600 words)

Commit all changes as a single PR titled "chore: harvest lessons from PRs #X, #Y, #Z"
```

### Mode B: Manual Mining

Use when bootstrapping or catching up on older PRs without harvest summaries:

```
Read the existing LESSONS.md and .cursor/BUGBOT.md files.
Then mine the last 30 merged PRs for human review comments:

  gh pr list --state merged --limit 30 --json number,title
  gh api repos/{owner}/{repo}/pulls/{number}/comments

For each new lesson found:
1. Classify: REVIEWABLE / EDUCATIONAL / SINGLE-FILE
2. Check for duplicates against existing rules
3. Place in the right location

Commit as a single PR for team review.
```

### Deduplication (critical for repeat runs)

Before adding any rule, check if it's already covered:

```bash
# Search all BUGBOT.md files for the key concept
grep -ri "Promise.all\|unbounded" $(find . -name BUGBOT.md -path '*/.cursor/*')
```

A rule is a duplicate if:
- The same pattern is already named (even with different wording)
- A broader rule already covers it (e.g., "stale closures" covers "useCallback with empty deps")
- The same PR number is already referenced

When in doubt, DON'T add it. Fewer focused rules beat more overlapping rules.

## Phase 3: Audit (`/pr-war-stories audit`)

Run quarterly to measure and optimize.

```
Check the last 20 Bugbot-reviewed PRs:

  gh pr list --state merged --limit 20 --json number,title
  gh api repos/{owner}/{repo}/pulls/{number}/reviews
  gh api repos/{owner}/{repo}/pulls/{number}/comments

For each Bugbot comment, classify as:
- USEFUL: caught a real issue or gave project-specific feedback
- NOISE: generic advice the developer already knew
- MISS: human reviewer caught something Bugbot should have

Report:
1. Hit rate (useful / total)
2. Rules that produced useful comments (keep)
3. Rules that never triggered (candidates for removal)
4. Human catches to encode as new rules

Then optimize:
- Re-classify all rules (REVIEWABLE/EDUCATIONAL/SINGLE-FILE/STALE)
- Merge overlapping rules
- Remove stale rules
- Move misplaced rules to correct layer
- Verify token budget
```

## Phase 4: Add Module (`/pr-war-stories add-module <path>`)

When a new complex module is added:

```
Read the existing .cursor/BUGBOT.md files to understand tone and format.
Read the code in <path> and identify:
1. Non-obvious architectural constraints
2. State management patterns easy to break
3. External API quirks or integration gotchas
4. Persistence formats that must not change without migration

Write a .cursor/BUGBOT.md in the module directory.
Keep under 400 words. Only REVIEWABLE rules.
```

## Anti-Patterns to Avoid

- **Generic advice** ("write tests", "use TypeScript") -- CI and linters handle this
- **Wish-list rules** ("we should migrate to X") -- rules are for the code AS IT IS
- **Novel-length rules** -- if a rule needs a paragraph to explain, it's too complex for a bot
- **Duplicating CI** -- don't encode build order, lint thresholds, or test requirements
- **Over-nesting** -- don't create BUGBOT.md for every directory; only where real war stories exist
- **Forgetting inline comments** -- single-file rules in BUGBOT.md waste attention on 99% of PRs
- **Open feedback loop** -- always install the harvest workflow so lessons don't get lost
