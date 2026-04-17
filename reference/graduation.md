# When to Graduate a Rule to Lint / Test / CI

BUGBOT.md is for **fuzzy, contextual, project-specific** review logic that deterministic tools can't catch. If a rule CAN be enforced reliably by a linter, type checker, or test, it SHOULD be — and then removed from BUGBOT.md.

## Graduate a rule out of BUGBOT.md when

- A linter rule or plugin exists (e.g., `no-floating-promises` replaces "always await async calls").
- A type constraint catches it (e.g., branded types prevent ID mixups).
- A test reliably detects it (e.g., integration test catches missing `ON CLUSTER`).
- A pre-commit hook can enforce it (e.g., formatting, import ordering).
- The pattern was eliminated from the codebase — all call sites already do the right thing. A rule for a dead pattern is noise. Drop it.

## Keep a rule in BUGBOT.md when

- It requires understanding intent — e.g., *"this `===` is intentional, do not change to deepEqual."*
- It's about a non-obvious interaction between components.
- The pattern is too contextual for static analysis — e.g., *"when renaming a shared enum value, update ALL serialization sites, not just the type definition."*
- It's about what NOT to do in a specific area — negative knowledge that linters can't express.

During every audit ([audit.md](../commands/audit.md)), actively look for rules that have matured into lint-able patterns and graduate them. Shrinking BUGBOT.md is a health signal, not a regression.
