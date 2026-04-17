# Rule Classification

Every rule must be classified before placement. This is the single source of truth — other phase files link here.

| Class | Definition | Goes in |
|---|---|---|
| **REVIEWABLE** | Bot can check this against a diff. | `.cursor/BUGBOT.md` |
| **EDUCATIONAL** | Informative but bot can't enforce. | `LESSONS.md` |
| **SINGLE-FILE** | Applies to one file or function only. | Inline comment in the source file |
| **OVERLAPPING** | Says the same thing as an existing rule. | Merge with the existing rule; don't add a new one. |
| **STALE** | Pattern was already fixed or code was removed. | Drop. |

## How to classify

### Pre-gate: is the rule worth keeping at all?

Before classifying, reject rules that fail any of these:

- **Generic** — "always validate user input", "write tests", "use TypeScript". Covered by quality-bar "Specific" criterion. Drop.
- **Aspirational** — "we should migrate to X". Rules are for the code as it is. Drop.
- **Style preference** — "prefer early returns", "rename this variable". Belongs in a linter config. Drop.
- **A rejected suggestion** — reviewer suggested X, author deliberately chose Y, team agreed. This is a design decision, not a rule. Drop.

### Then ask in order

1. **Is it already covered** by an existing rule (same pattern, broader subsuming rule, or same PR number)? → OVERLAPPING.
2. **Is the pattern it warns about already gone** from the codebase? → STALE.
3. **Can the bot verify it on a diff alone?** → REVIEWABLE.
4. **Does it apply to exactly one file or function?** → SINGLE-FILE.
5. **Is it general engineering wisdom the IDE assistant should see at write-time?** → EDUCATIONAL.

## Important: no cross-layer duplication

A rule lives in ONE place. If it's in BUGBOT.md, it does NOT also go in LESSONS.md. Duplication is noise — the same developer sees the same rule twice in the same PR. During audit, check for and eliminate duplicates.

## Examples

- *"Don't use Promise.all on unbounded arrays — use a concurrency limiter."* → REVIEWABLE → root BUGBOT.md
- *"Build order: packages must compile before apps."* → EDUCATIONAL → LESSONS.md
- *"This adapter uses reference equality intentionally — do not change to deepEqual."* → SINGLE-FILE → inline comment in the adapter file.
- *"Always validate user input."* → pre-gate: generic → drop (not a classification target).
- *"Never call the legacy `v1Client`."* — but `v1Client` was deleted two quarters ago → STALE → drop.
