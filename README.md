# pr-war-stories

**Your team's best reviewer is about to quit. Their knowledge doesn't have to.**

AI code reviewers are stateless. They don't know your team spent a week debugging a race condition last month. They don't know that `===` check is intentional. They don't know the last three people who touched that module all introduced the same bug.

This skill fixes that. It mines your PR history for hard-won lessons and injects them where AI reviewers will actually use them.

## The Problem

A senior engineer reviews a PR and writes:

> *"Be careful here -- `MemoryStorageAdapter` preserves object references intentionally. The `===` check is correct. Don't change it to deep equality or you'll trigger unnecessary Redux dispatches."*

That comment lives on a merged PR that nobody will ever read again. Three months later, a new contributor "fixes" the `===` check. The same bug. The same review cycle. The same wasted time.

**AI reviewers make this worse.** Cursor Bugbot, CodeRabbit, and Copilot will confidently approve the "fix" because the code is syntactically correct. They have no memory of the war story.

## The Solution

`pr-war-stories` creates a knowledge system that feeds your team's institutional memory directly into the AI reviewer's context window:

```
Your PR history                          What the AI reviewer sees
-----------------                        --------------------------

"Don't use Promise.all on        --->    .cursor/BUGBOT.md (global)
 unbounded arrays, we OOM'd"            "Never use Promise.all on unbounded
                                         arrays. Use a concurrency limiter."

"This is runtime-eval JS,        --->    Inline code comment
 you can't import here"                  // WARNING: Runtime-evaluated JS string.
                                         // Cannot use imports. (See PR #760)

"useState captures values         --->   LESSONS.md
 one frame late, use useRef"            "When you need synchronous capture
                                         at a state transition, use useRef."
```

Three layers, each optimized for a different reader:

| Layer | File | Reader | Purpose |
|-------|------|--------|---------|
| **Bot rules** | `.cursor/BUGBOT.md` | Cursor Bugbot during PR review | Rules the bot can enforce on a diff |
| **Lessons** | `LESSONS.md` | Claude Code / Cursor IDE | Universal principles that inform how you write code |
| **Inline** | Source code comments | Bot when that file is in the diff | Single-file warnings exactly where they matter |

## How It Works

```
/pr-war-stories setup           (one-time: bootstrap from your PR history)
         |
         v
    Mines 50 merged PRs
    Extracts human review comments
    Creates hierarchical BUGBOT.md files
    Creates LESSONS.md
    Installs GitHub Action
         |
         v
    Every future PR merge  ---->  harvest-lessons.yml fires automatically
                                  Surfaces new review comments
                                  Posts harvest summary on the merged PR
                                       |
                                       v
                                  /pr-war-stories harvest
                                  (you process them periodically)
                                       |
                                       v
                                  Rules updated, bot gets smarter
                                       |
                               --------+--------
                               |               |
                               v               v
                          Next PR review   Next PR review
                          catches more     catches more
```

The feedback loop is semi-automated: a GitHub Action extracts the signal (human review comments) on every merge. You run one command to classify and commit the new rules.

## Install

```bash
claude install-skill sscarduzio/pr-war-stories
```

Or manually:

```bash
mkdir -p ~/.claude/skills/pr-war-stories
curl -o ~/.claude/skills/pr-war-stories/SKILL.md \
  https://raw.githubusercontent.com/sscarduzio/pr-war-stories/main/SKILL.md
```

## Quick Start

Open Claude Code in any repo with PR history:

```
/pr-war-stories setup
```

That's it. The skill will:

1. Explore your repo structure and tech stack
2. Mine the last 50 merged PRs for human review comments
3. Extract war stories (race conditions, gotchas, "this broke before when...")
4. Create `.cursor/BUGBOT.md` files scoped to your directory structure
5. Distill universal lessons into `LESSONS.md`
6. Install the `harvest-lessons.yml` GitHub Action for the feedback loop
7. Wire up `CLAUDE.md` / `AGENTS.md` so IDE assistants read the lessons

## Commands

| Command | When | What it does |
|---------|------|-------------|
| `/pr-war-stories setup` | Once per repo | Full bootstrap from PR history |
| `/pr-war-stories harvest` | Monthly, or when you see harvest summaries | Process new lessons into rule files |
| `/pr-war-stories audit` | Quarterly | Measure hit rate, remove stale rules, optimize |
| `/pr-war-stories add-module <path>` | When adding complex new code | Bootstrap rules for a new module |

## Why Three Layers?

We tried putting everything in BUGBOT.md. It didn't work.

**The bot has a context window.** Every rule competes for attention. When you dump 50 rules into one file, the bot's review quality drops -- it starts ignoring the important ones.

The fix: **only put rules in BUGBOT.md that the bot can actually check against a diff.** Everything else goes somewhere more appropriate:

- *"Build order requires packages before apps"* -- the bot can't check this. CI does. Goes in **LESSONS.md**.
- *"This adapter preserves object references intentionally"* -- applies to one file. Goes as an **inline comment**.
- *"Don't use Promise.all on unbounded arrays"* -- the bot can see this in the diff. Goes in **BUGBOT.md**.

The skill enforces this classification automatically during setup and harvest.

## Token Budget

More rules does not mean better reviews. The skill enforces:

- **< 400 words** per BUGBOT.md file (ideal)
- **< 600 words** (acceptable)
- **> 800 words** (too fat -- audit triggered)
- **< 2000 tokens** worst-case combined load

During audit, every rule gets re-classified:

| Classification | Action |
|----------------|--------|
| **REVIEWABLE** | Keep in BUGBOT.md |
| **EDUCATIONAL** | Move to LESSONS.md |
| **SINGLE-FILE** | Move to inline code comment |
| **OVERLAPPING** | Merge with similar rule |
| **STALE** | Remove |

## The Hierarchy

BUGBOT.md files are hierarchical. Cursor Bugbot traverses **upward** from each changed file, collecting all `.cursor/BUGBOT.md` files it encounters:

```
.cursor/BUGBOT.md                              <-- every PR gets this
apps/frontend/.cursor/BUGBOT.md                <-- frontend PRs get this + global
apps/frontend/src/editor/.cursor/BUGBOT.md     <-- editor PRs get all three
packages/.cursor/BUGBOT.md                     <-- package PRs get this + global
```

The deepest module gets the most context. A simple package change gets only the relevant rules. No wasted tokens.

## Real Example

We built this on a React/TypeScript monorepo with 800+ merged PRs. Here are actual rules the skill extracted:

> **From a reviewer catching a production OOM:**
> "Unbounded `Promise.all` on file uploads causes OOM. Use a concurrency limiter with max 3 parallel ops."

> **From a bug that took 3 days to debug:**
> "`JSON.stringify` silently drops `undefined`. If you need to clear a server-side field, use `null`."

> **From a reviewer explaining a non-obvious pattern:**
> "`MemoryStorageAdapter.appendItems` preserves object references intentionally. `===` is correct. Don't change to deep equality."

> **From an incident where an AI tool broke unrelated code:**
> "Large-scale CSS changes can break unrelated components via shared class names. A sidebar change collapsed the schema editor to zero height."

After setup, Bugbot caught a real bug in the harvest workflow itself -- the scope detection used `else if` instead of `if`, causing linkchart files to miss parent scope rules. The system was already paying for itself.

## What Makes a Good Rule

A good BUGBOT.md rule is:

- **Actionable** -- the bot can check it against a diff
- **Specific** -- references real file paths, function names, or patterns
- **Surprising** -- not obvious to a competent developer seeing the code for the first time
- **Concise** -- rule + explanation in under 50 words

A bad rule is:

- Generic advice ("write tests", "use TypeScript")
- Already enforced by CI (build order, lint thresholds)
- So specific it only applies to one file (use inline comment)
- Educational without being actionable (move to LESSONS.md)

## Requirements

- A GitHub repo with merged PRs (the more history, the better)
- [`gh` CLI](https://cli.github.com/) authenticated
- [Cursor Bugbot](https://www.cursor.com/dashboard/bugbot) enabled (free)
- [Claude Code](https://claude.ai/code)

## FAQ

**Does this work with CodeRabbit / Copilot / other reviewers?**
The BUGBOT.md files are Cursor Bugbot-specific. LESSONS.md and inline comments work with any AI assistant. Adapting the skill for other reviewers' config formats is straightforward.

**How long does setup take?**
5-15 minutes depending on how many PRs have human review comments. The skill parallelizes PR mining.

**Will this slow down my CI?**
The harvest Action runs only on merged PRs, takes ~10 seconds, uses no external services, and only posts a comment if there are substantive human review comments to surface.

**What if we don't use Cursor Bugbot?**
You still get LESSONS.md (read by Claude Code and Cursor IDE), inline code comments (visible to any reviewer), and the harvest Action (surfaces review comments regardless of review tool). The BUGBOT.md files just won't have a consumer until you enable a compatible reviewer.

## License

MIT
