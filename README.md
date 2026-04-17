# pr-war-stories

**Stop reviewing the same bugs.**

Every PR review is a debate about architecture, tradeoffs, style, and quality. Then the PR merges and the debate dies. `pr-war-stories` distills those review comments into rules your AI code reviewer enforces on the next PR.

```
- await Promise.all(files.map(upload))          // PR #781: OOM'd in prod
+ await asyncPool(3, files, upload)             // Now a BUGBOT.md rule
```

## Why this works when other "feed the bot your style guide" tools don't

Three insights, each validated on 759 real merged PRs across two production repos:

**1. Where a rule lives decides whether anyone reads it.** A bot reading your diff, an IDE assistant helping you write code, and a human scanning source all have different contexts. Rules at the wrong layer are invisible. The skill writes three layers — `.cursor/BUGBOT.md`, `LESSONS.md`, and inline source comments — and classifies every rule into exactly one.

**2. Author-dismissals of bot findings are the highest-yield source of rule material.** When the author replies *"Dismissed — intentional because X"* to a bot, X is a pre-written, locally-scoped, immediately-preventive rule. Harvesting these first beat harvesting reviewer suggestions by 2–3× on real data. The skill prioritizes them.

**3. Token budget beats rule count.** 50 rules crammed in one config file means the bot ignores all of them. Caps per scope: 400w ideal, 600w acceptable, >800 fails. Fewer rules = more attention per rule.

Plus one self-learning mechanism:

**4. A GitHub Action closes the loop.** Every merged PR with substantive human review comments produces a harvest proposal. `/pr-war-stories harvest` classifies and commits. The bot gets smarter on the next PR.

## Real results

Ran on `Octostarco/octostar-frontend` (415 PRs, 8 months): mined 1,067 substantive review comments + 227 author-dismissals. Surfaced that the `Apps/` module had 442 of those 1,067 comments (41% of all review activity) but **no scope file** — the original setup picked the wrong modules. [PR #805](https://github.com/Octostarco/octostar-frontend/pull/805).

Ran on `Octostarco/octostar-api` (344 PRs, 8 months): mined 1,685 comments + 174 dismissals. Discovered my own harvest workflow was misclassifying 308 GitHub-Copilot review comments as "substantive human feedback" because Copilot's login has no `[bot]` suffix. Fixed.

Both findings became new skill doctrine. The skill's own `/audit` and `/rebalance` commands are designed to catch exactly these mistakes going forward.

## Install

```bash
claude install-skill sscarduzio/pr-war-stories
```

Then, in any repo with merged PRs and review history:

```
/pr-war-stories setup
```

The skill mines your last 50 merged PRs, classifies review comments into rules, writes the three memory layers, wires up the GitHub Action, and reports a budget summary. One command, about 10 seconds of your time, a few minutes of its time.

## Works with

- **Cursor Bugbot** — first-class. Reads `.cursor/BUGBOT.md` hierarchy automatically.
- **CodeRabbit, Copilot Code Review, other bots** — the `BUGBOT.md` files exist in the repo; those bots won't find them unless you configure their "read this file" setting manually. The skill writes the rules; wiring the reader is out of scope.
- **Claude Code, Cursor (IDE assistants)** — wired automatically by setup via `CLAUDE.md` / `AGENTS.md` pointers.
- **Any reviewer that reads source files** — Layer 3 inline comments Just Work.

Requires `gh` CLI and GitHub Actions. Works with any merge strategy. Any language. MIT.

## Repository layout

```
SKILL.md              Entry point — concepts, command dispatch, terminology.
commands/             One file per command. Loaded on demand.
  setup.md            Bootstrap the system (runs once per repo).
  harvest.md          Process review comments on merged PRs into rules.
  audit.md            Quarterly effectiveness review.
  rebalance.md        Promote hot-traffic modules, demote cold scopes.
  add-module.md       Create BUGBOT.md for a new complex module.
  recheck.md          Verify rules still reference real code.
reference/            Shared definitions, linked from every command.
  classification.md   REVIEWABLE / EDUCATIONAL / SINGLE-FILE / OVERLAPPING / STALE.
  quality-bar.md      Format and quality criteria for each layer.
  anti-patterns.md    What NOT to do.
  graduation.md       When to retire a rule into lint/test/CI.
templates/
  harvest-lessons.yml The GitHub Action installed by `/pr-war-stories setup`.
docs/                 Landing page at sscarduzio.github.io/pr-war-stories.
```

## The three-layer architecture

Not all knowledge belongs in the same place:

```mermaid
graph LR
  subgraph "Layer 1 — Bot Memory"
    B[".cursor/BUGBOT.md"]
  end
  subgraph "Layer 2 — Developer Memory"
    L["LESSONS.md"]
  end
  subgraph "Layer 3 — File Memory"
    I["Inline comments"]
  end

  PR["PR Review Comment"] --> C{"Can the bot<br/>check this<br/>on a diff?"}
  C -->|Yes| S{"Scope?"}
  S -->|Cross-cutting| B
  S -->|One module| B2[".cursor/BUGBOT.md<br/>(module-level)"]
  S -->|One file| I
  C -->|No| E{"Applies to<br/>one file?"}
  E -->|Yes| I
  E -->|No| L

  style B fill:#1a3a2a,stroke:#2ecc71,color:#fff
  style B2 fill:#1a3a2a,stroke:#2ecc71,color:#fff
  style L fill:#1a2a3a,stroke:#4a9eff,color:#fff
  style I fill:#2a2a1a,stroke:#f39c12,color:#fff
  style C fill:#2a1a1a,stroke:#e74c3c,color:#fff
  style E fill:#2a1a1a,stroke:#e74c3c,color:#fff
  style S fill:#2a1a2a,stroke:#9b59b6,color:#fff
```

| Layer | File | When it's read | What goes here |
|-------|------|---------------|----------------|
| **Bot rules** | `.cursor/BUGBOT.md` | Bugbot reviews a PR | Rules the bot can enforce on a diff |
| **Lessons** | `LESSONS.md` | Developer starts coding | Concrete before/after code examples |
| **Inline** | Source code comments | That file appears in a diff | Single-file warnings |

### What does NOT belong

- **If it can be linted or tested deterministically**, graduate it out of BUGBOT.md and into a linter rule or test. BUGBOT is for fuzzy, contextual knowledge that needs understanding intent.
- **Style preferences** ("prefer early returns", "use descriptive names") belong in linter config, not BUGBOT.md.
- **Suggestions that were discussed but rejected** are design decisions, not rules.

## Hierarchical scoping

BUGBOT.md files are hierarchical. The bot traverses **upward** from each changed file, collecting rules at every level:

```mermaid
graph TD
  R[".cursor/BUGBOT.md<br/><i>every PR</i>"] --> A["apps/frontend/.cursor/BUGBOT.md<br/><i>frontend PRs</i>"]
  R --> P["packages/.cursor/BUGBOT.md<br/><i>package PRs</i>"]
  A --> E["apps/.../editor/.cursor/BUGBOT.md<br/><i>editor PRs get all three</i>"]

  style R fill:#1a1a2e,stroke:#e74c3c,color:#fff
  style A fill:#1a1a2e,stroke:#4a9eff,color:#fff
  style E fill:#1a1a2e,stroke:#2ecc71,color:#fff
  style P fill:#1a1a2e,stroke:#9b59b6,color:#fff
```

Token budget stays under control:

- **< 400 words** per file (ideal)
- **< 2000 tokens** worst-case combined load

### Cross-cutting rules & refactor survival

- Cross-module rules go in the **root** BUGBOT.md. Don't duplicate into module files.
- If the same bug recurs in a different module, **promote the rule upward**.
- After big refactors: run `/pr-war-stories recheck` to catch rules referencing moved/deleted code.

## The automated feedback loop

```mermaid
graph LR
  M["PR Merged"] --> H["harvest-lessons.yml<br/><i>fires automatically</i>"]
  H --> S["Summary posted<br/>on merged PR"]
  S --> D["/pr-war-stories harvest<br/><i>human classifies</i>"]
  D --> R["Rules updated in<br/>BUGBOT / LESSONS / inline"]
  R -->|"next PR"| M

  style M fill:#1a1a2e,stroke:#e74c3c,color:#fff
  style H fill:#1a1a2e,stroke:#f39c12,color:#fff
  style S fill:#1a1a2e,stroke:#4a9eff,color:#fff
  style D fill:#1a1a2e,stroke:#2ecc71,color:#fff
  style R fill:#1a1a2e,stroke:#9b59b6,color:#fff
```

No knowledge falls through the cracks.

## Commands

| Command | When | What |
|---------|------|------|
| `/pr-war-stories setup` | Once per repo | Full bootstrap from PR history |
| `/pr-war-stories harvest` | When harvest summaries appear | Classify new lessons, place in the right layer |
| `/pr-war-stories recheck` | After big refactors | Verify all rules reference code that still exists |
| `/pr-war-stories audit` | Quarterly | Measure hit rate, prune stale rules, graduate to lint |
| `/pr-war-stories rebalance` | When audit flags hierarchy mismatch | Promote hot modules, demote cold scopes |
| `/pr-war-stories add-module <path>` | New complex module added | Bootstrap scoped rules for it |

### Automated (no human trigger)

| What | When |
|------|------|
| `harvest-lessons.yml` GitHub Action | Every PR merge — extracts substantive human comments, posts harvest summary |

## Real war stories

These are actual rules extracted from production PRs:

```diff
# PR #781 — Production OOM → BUGBOT.md
- await Promise.all(files.map(upload))
+ await asyncPool(3, files, upload)

# PR #775 — LLM CSS broke schema editor → BUGBOT.md
- .custom-antlayout { height: 100% }
+ .schema-editor-layout { height: 100% }

# PR #735 — Bugbot dismissed 7× on one line → BUGBOT.md (scope-level)
- useEffect(() => {...}, [data, setData])    // bot: "missing dep!"
+ one scope rule silenced all 7 future false positives

# PR #760 — Runtime-evaluated JS string, can't DRY → Inline comment
// AIPanelTemplate.ts is a runtime-evaluated CustomTemplate string.
// It cannot import TypeScript modules. Duplication is structural.
// (See PR #760)

# PR #741 — useState 1 frame late → LESSONS.md
- const [val, setVal] = useState(x)
+ const valRef = useRef(x) // sync capture
```

Running the v0.7 harvest on these two repos surfaced a real miscalibration: one module in the frontend had 442 of 1,067 substantive review comments (41% of all review activity) but no scope file. The skill flagged it. New `rebalance` command now catches this pattern across any repo.

## Example LESSONS.md entries

Every lesson has concrete `// WRONG` / `// RIGHT` code. Here are three from a real frontend repo:

### Promise.all on unbounded arrays causes OOM

```ts
// WRONG: OOM on large file lists
await Promise.all(files.map(f => uploadFile(f)));

// RIGHT: bounded parallelism
import pLimit from 'p-limit';
const limit = pLimit(3);
await Promise.all(files.map(f => limit(() => uploadFile(f))));
```
*(PR #781)*

### Use null to clear fields, not undefined

```ts
// WRONG: field silently omitted from payload
const update = { name: "new", description: undefined };
JSON.stringify(update); // '{"name":"new"}' — description not cleared

// RIGHT: null explicitly clears the field
const update = { name: "new", description: null };
JSON.stringify(update); // '{"name":"new","description":null}'
```

### Reference equality (===) can be intentional

```tsx
// The bot flagged this as a bug:
if (prev === next) return; // "should be deepEqual"

// But it was intentional — the upstream cache preserves identity across
// reads, so === is both correct and faster than deep equality here.
if (prev === next) return; // intentional ref check — see PR #NNN
```
*(PR #NNN)*

And from a Python backend repo:

### Don't catch `Exception` — catch what you expect

```python
# WRONG: swallows KeyboardInterrupt, SystemExit, every import error, …
try:
    parsed = json.loads(content)
except Exception:
    parsed = content

# RIGHT: narrow except, fall-through is intentional
try:
    parsed = json.loads(content)
except json.JSONDecodeError:
    pass  # content is YAML or raw text; caller handles
```
*(PR #NNN)*

**Drop aggressively.** 8 concrete lessons beat 15 vague ones. If you can't show the wrong way and the right way in code, it doesn't belong in LESSONS.md.

## Requirements

- GitHub repo with merged PRs (or any codebase — the skill bootstraps from code reading if PR history is thin)
- [`gh` CLI](https://cli.github.com/) authenticated
- [Cursor Bugbot](https://www.cursor.com/dashboard/bugbot) enabled (free) — or any reviewer that reads `.cursor/BUGBOT.md`
- [Claude Code](https://claude.ai/code)

## FAQ

**Does this work without Cursor Bugbot?**
Yes. LESSONS.md works with any IDE assistant. Inline comments work with any reviewer. The harvest Action works regardless. BUGBOT.md files just need a compatible consumer.

**Does this work with CodeRabbit / Copilot?**
LESSONS.md and inline comments work with anything. BUGBOT.md is Cursor-specific but the format could be adapted.

**Won't BUGBOT.md rot like every other living doc?**
The quarterly audit catches staleness: rules that never trigger get removed, fixed patterns get graduated to lint. The harvest Action keeps fresh ones coming in.

**How long does setup take?**
5-15 minutes. The skill parallelizes PR mining.

**Will this slow down CI?**
The harvest Action runs only on merged PRs, takes ~10 seconds, uses no external services, and only posts a comment when there are substantive human review comments.

**What if we have very few PRs?**
The skill falls back to bootstrapping from code reading — it looks for TODO/FIXME/HACK comments, complex untested functions, and git blame hotspots.

**What about big refactors / module renames?**
Run `/pr-war-stories recheck`. It greps every rule for path/function references, verifies they still exist, and flags stale `scopeRules` prefixes. Reports but does not auto-fix — you decide whether to update, remove, or promote each rule.

**What if a reviewer's suggestion wasn't adopted?**
Rejected suggestions are not rules. The harvest step filters for this: only corrections that were actually adopted, and warnings about real pitfalls, become rules.

## Links

- [Landing page](https://sscarduzio.github.io/pr-war-stories/)
- [Presentation slides](https://sscarduzio.github.io/pr-war-stories/presentation.html)

## License

MIT
