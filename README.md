# pr-war-stories

A Claude Code skill that builds a self-improving AI code review system from your PR history.

## What It Does

Mines your merged PRs for human review comments and bug-fix lessons, then encodes that institutional knowledge where AI review bots can use it:

```
PR merged to main
      |
      v
harvest-lessons.yml fires             <-- automated GitHub Action
      |
      v
Surfaces human review comments
      |
      v
/pr-war-stories harvest               <-- you run this
      |
      v
Updates rules in three layers:
  .cursor/BUGBOT.md  (bot-enforced)
  LESSONS.md         (IDE-read)
  inline comments    (in-file)
```

## Why

AI code reviewers (Cursor Bugbot, CodeRabbit, etc.) are stateless. They don't know that your team spent a week debugging a race condition last month, or that a certain `===` check is intentional. This skill extracts those "war stories" from your PR history and injects them into the bot's context window.

## Install

### Claude Code CLI

```bash
claude install-skill sscarduzio/pr-war-stories
```

### Manual

Copy `SKILL.md` to `~/.claude/skills/pr-war-stories/SKILL.md`:

```bash
mkdir -p ~/.claude/skills/pr-war-stories
curl -o ~/.claude/skills/pr-war-stories/SKILL.md \
  https://raw.githubusercontent.com/sscarduzio/pr-war-stories/main/SKILL.md
```

## Usage

### Bootstrap a new repo

```
/pr-war-stories setup
```

This will:
1. Explore your repo structure
2. Mine the last 50 merged PRs for war stories
3. Create hierarchical `.cursor/BUGBOT.md` files
4. Create `LESSONS.md` with universal takeaways
5. Install `harvest-lessons.yml` GitHub Action for the feedback loop
6. Wire up `CLAUDE.md` / `AGENTS.md` pointers

### Process new lessons

```
/pr-war-stories harvest
```

Reads automated harvest summaries from merged PRs (or mines manually) and updates the rule files.

### Audit effectiveness

```
/pr-war-stories audit
```

Measures hit rate of Bugbot reviews, identifies stale/noisy rules, and optimizes token budget.

### Add rules for a new module

```
/pr-war-stories add-module src/components/new-module
```

## The Three-Layer Architecture

| Layer | File | Who reads it | Rule type |
|-------|------|-------------|-----------|
| Bot rules | `.cursor/BUGBOT.md` | Cursor Bugbot on PR review | Reviewable: bot can check against a diff |
| Lessons | `LESSONS.md` | Claude Code, Cursor IDE | Educational: informs how devs write code |
| Inline | Source code comments | Bot when file is in diff | Single-file: applies to one function/file |

### Why three layers?

- **BUGBOT.md** rules compete for bot attention. Fewer = better. Only put rules the bot can actually enforce.
- **LESSONS.md** is read by IDE assistants before developers write code. Good for "why" explanations.
- **Inline comments** are the most targeted: the bot only sees them when that exact file is in the diff.

## Token Budget

The skill enforces token discipline:

- Under 400 words per BUGBOT.md file (ideal)
- Under 600 words (acceptable)
- Over 800 words (too fat -- needs audit)
- Worst-case combined load under 2000 tokens

## Rule Classification

Every rule gets classified before placement:

- **REVIEWABLE** -- Bot can check against a diff. Goes in BUGBOT.md.
- **EDUCATIONAL** -- Informative but not enforceable. Goes in LESSONS.md.
- **SINGLE-FILE** -- Applies to one file. Goes as inline code comment.
- **OVERLAPPING** -- Same as another rule. Merge.
- **STALE** -- Pattern was fixed. Remove.

## Requirements

- GitHub repository with PR history
- `gh` CLI authenticated
- Cursor Bugbot enabled (free at [cursor.com/dashboard/bugbot](https://www.cursor.com/dashboard/bugbot))
- Claude Code

## License

MIT
