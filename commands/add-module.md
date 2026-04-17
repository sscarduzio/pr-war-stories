# Add Module

`/pr-war-stories add-module <path>` — add rules for a newly-complex module.

Use when a new directory justifies its own `.cursor/BUGBOT.md` — i.e., there are module-specific war stories or unique constraints that don't belong in the root or app-level file.

## Procedure

1. **Read existing `.cursor/BUGBOT.md` files** to match tone, format, and rule density.
2. **Read the code in `<path>`** and identify:
   - Non-obvious architectural constraints.
   - State-management patterns easy to break.
   - External API quirks or integration gotchas.
   - Persistence formats that must not change without migration.
3. **Write `<path>/.cursor/BUGBOT.md`** using [quality-bar.md](../reference/quality-bar.md). Only REVIEWABLE rules — module-specific EDUCATIONAL content goes to LESSONS.md, module-specific SINGLE-FILE rules go inline.
4. **Keep under 400 words.** If you're pushing the limit, ruthlessly classify against [classification.md](../reference/classification.md) and drop.
5. **Update `scopeRules`** in `.github/workflows/harvest-lessons.yml` — add `{ prefix: '<path>/', scope: '<module-name>' }` so future harvests route review comments to the right file.
6. **Recheck.** Read [`recheck.md`](recheck.md) and execute it inline as the final step — verify every reference in the new rules resolves to real code.
