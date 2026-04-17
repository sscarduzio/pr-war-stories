# Anti-Patterns

The canonical list of what NOT to do. Each is the failure mode of a specific doctrine elsewhere in the skill — cross-references below.

## Bad rule content

- **Generic advice** — "write tests", "use TypeScript". CI and linters handle this. (See [quality-bar.md](quality-bar.md): Specific.)
- **Wish-list rules** — "we should migrate to X". Rules are for the code AS IT IS, not aspirations.
- **Novel-length rules** — if a rule needs a paragraph to explain, it's too complex for a bot. Split or drop. (See [quality-bar.md](quality-bar.md): Concise.)
- **Rejected suggestions as rules** — if a reviewer suggested X and the author deliberately chose Y, that's a design decision, not a rule.
- **Style preferences as rules** — "prefer early returns", "use descriptive names" belong in linter config, not BUGBOT.md.

## Bad placement

- **Cross-layer duplication** — same rule in BUGBOT.md and LESSONS.md wastes attention. (See [classification.md](classification.md): no cross-layer duplication.)
- **Single-file rules in BUGBOT.md** — wastes attention on the 99% of PRs that don't touch that file. Use an inline comment instead.
- **Duplicating CI** — build order, lint thresholds, test requirements already live in CI config. Don't re-encode.

## Bad architecture

- **Over-nesting** — don't create BUGBOT.md for every directory; only where real war stories exist.
- **Open feedback loop** — always install the harvest workflow. Lessons left on old PRs are lost lessons.
