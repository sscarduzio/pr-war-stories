# pr-war-stories

**Stop reviewing the same bugs.**

An engineer left a PR comment three months ago. Nobody read it again. A junior dev "fixed" the code. The bot approved it. This skill makes sure that never happens again.

## What it does

`pr-war-stories` is a Claude Code skill that mines your PR history for lessons learned, then injects them where your AI code reviewer will actually use them.

```
- await Promise.all(files.map(upload))          // PR #781: OOM'd in prod
+ await asyncPool(3, files, upload)             // Now a BUGBOT.md rule
```

## Install

```bash
claude install-skill sscarduzio/pr-war-stories
```

Then open Claude Code in any repo:

```
/pr-war-stories setup
```

The skill will explore your repo, mine your last 50 merged PRs, extract war stories from human review comments, and create everything automatically.

## The three-layer architecture

Not all knowledge belongs in the same place:

| Layer | File | When it's read | What goes here |
|-------|------|---------------|----------------|
| **Bot rules** | `.cursor/BUGBOT.md` | Bugbot reviews a PR | Rules the bot can enforce on a diff |
| **Lessons** | `LESSONS.md` | Developer starts coding | Universal principles (the "why") |
| **Inline** | Source code comments | That file appears in a diff | Single-file warnings |

### Why three layers?

The bot has a context window. Every rule competes for attention. When you dump 50 rules into BUGBOT.md, the bot ignores the important ones.

The fix: **classify every lesson before placing it.**

- Bot can check it on a diff? &rarr; `.cursor/BUGBOT.md`
- Applies to one file only? &rarr; Inline code comment
- Educational, not enforceable? &rarr; `LESSONS.md`
- Duplicate of another rule? &rarr; Merge
- Pattern was fixed? &rarr; Remove

## Hierarchical scoping

BUGBOT.md files are hierarchical. The bot traverses **upward** from each changed file, collecting rules at every level:

```
.cursor/BUGBOT.md                              <-- every PR
  apps/frontend/.cursor/BUGBOT.md              <-- frontend PRs
    apps/frontend/src/editor/.cursor/BUGBOT.md <-- editor PRs get all three
  packages/.cursor/BUGBOT.md                   <-- package PRs
```

Deeper modules get more context. Simple changes get only relevant rules. Token budget stays under control:

- **< 400 words** per file (ideal)
- **< 2000 tokens** worst-case combined load

## The automated feedback loop

A GitHub Action (`harvest-lessons.yml`) fires on every merged PR:

```
PR merged to main
      |
      v
harvest-lessons.yml extracts human review comments
(filters bots, skips "LGTM", maps to BUGBOT.md scopes)
      |
      v
Posts harvest summary on the merged PR
      |
      v
Developer runs /pr-war-stories harvest
      |
      v
New rules committed, bot uses them on next review
      |
      (loop continues)
```

No knowledge falls through the cracks.

## Commands

| Command | When | What |
|---------|------|------|
| `/pr-war-stories setup` | Once per repo | Full bootstrap from PR history |
| `/pr-war-stories harvest` | When you see harvest summaries | Process new lessons into rules |
| `/pr-war-stories audit` | Quarterly | Measure hit rate, prune stale rules |
| `/pr-war-stories add-module <path>` | New complex module added | Bootstrap rules for it |

## Real war stories

These are actual rules extracted from production PRs:

```diff
# PR #781 — Production OOM → BUGBOT.md
- await Promise.all(files.map(upload))
+ await asyncPool(3, files, upload)

# PR #775 — LLM CSS broke schema editor → BUGBOT.md
- .custom-antlayout { height: 100% }
+ .schema-editor-layout { height: 100% }

# PR #748 — Bot flagged === as bug → Inline comment
- if (deepEqual(prev, next))
+ if (prev === next) // intentional ref check

# PR #741 — useState 1 frame late → LESSONS.md
- const [val, setVal] = useState(x)
+ const valRef = useRef(x) // sync capture
```

After setup, Bugbot caught a real bug in the harvest workflow itself — the scope detection used `else if` instead of `if`, causing files to miss parent scope rules. The system was already paying for itself.

## Requirements

- GitHub repo with merged PRs (or any codebase — the skill bootstraps from code reading if PR history is thin)
- [`gh` CLI](https://cli.github.com/) authenticated
- [Cursor Bugbot](https://www.cursor.com/dashboard/bugbot) enabled (free)
- [Claude Code](https://claude.ai/code)

## FAQ

**Does this work without Cursor Bugbot?**
Yes. LESSONS.md works with any IDE assistant. Inline comments work with any reviewer. The harvest Action works regardless. BUGBOT.md files just need a compatible consumer.

**Does this work with CodeRabbit / Copilot?**
LESSONS.md and inline comments work with anything. BUGBOT.md is Cursor-specific but the format could be adapted.

**How long does setup take?**
5-15 minutes. The skill parallelizes PR mining.

**Will this slow down CI?**
The harvest Action runs only on merged PRs, takes ~10 seconds, uses no external services, and only posts a comment when there are substantive human review comments.

**What if we have very few PRs?**
The skill falls back to bootstrapping from code reading — it looks for TODO/FIXME/HACK comments, complex untested functions, and git blame hotspots.

## Links

- [Landing page](https://sscarduzio.github.io/pr-war-stories/)
- [Presentation slides](https://sscarduzio.github.io/pr-war-stories/presentation.html)

## License

MIT
