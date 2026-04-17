# Quality Bar

Apply this checklist to every rule before committing, in every phase (setup, harvest, add-module).

## BUGBOT.md rules (the enforceable layer)

- **Actionable** — the bot can check it against a diff.
- **Specific** — references real patterns from this codebase, not generic advice.
- **Surprising** — not obvious to a competent developer.
- **Concise** — 15–30 words. One sentence is ideal. Prose paragraphs are a bot-attention tax.
- **Verified** — the referenced function / file / pattern still exists in the codebase.
- **Live threat** — the pattern the rule warns about is still possible in the code. If the anti-pattern was already eliminated, the rule is history, not defence. Drop it.
- **Has provenance** — cites `(PR #NNN)` so a future reader can audit why.

Format:

```markdown
## Short Imperative Heading

1 sentence: what goes wrong and what to do instead. (PR #NNN)
```

Rules bootstrapped from code reading (not from a PR war story) must be tagged:

```markdown
## Tiptap Editor Lifecycle (bootstrapped — verify after usage)
```

This signals `/pr-war-stories audit`: educated guess, not battle-tested.

## LESSONS.md entries (the educational layer)

- **Has a `# WRONG` / `# RIGHT` code block** — no exceptions. If you can't show the bug and the fix in code, the lesson is too abstract. Either make it concrete or drop it.
- **Code is real** — pulled from the actual codebase, not pseudocode.
- **Has provenance** — cites `(PR #NNN)`.
- **Not team policy** — policies ("no TODOs", "use Prettier") belong in CLAUDE.md or CONTRIBUTING.md, not LESSONS.md.
- **Not a TODO** — "needs X migration first" is future work, not a lesson.
- **Not dev-tooling trivia** — if only one maintainer will ever touch it, skip.

Format (the outer fence shown here uses tildes only to nest cleanly; write the real lesson with a normal ```python fence):

~~~markdown
### Bold rule statement (verb-first, imperative)

1–2 sentences explaining what goes wrong.

```python
# WRONG
bad_code_here()

# RIGHT
good_code_here()
```

(PR #NNN)
~~~

**Drop aggressively.** 8 concrete lessons beat 15 vague ones. The IDE assistant pays more attention to each lesson when there are fewer of them.

## Inline code comments (the file-local layer)

- **Placed directly above the affected line/block** — not in a separate doc.
- **States the invariant, not the history** — "=== is intentional; adapter preserves references" beats "in PR #748 we argued about…"
- **One provenance cite at the end** — `(See PR #NNN)` or `(Bugbot dismissed in PR #NNN)`.
- **Tracks code through renames** — if the comment is inside the affected function/block, refactors carry it with the code. Block-level or file-top comments must be moved manually when you move the code.
- **Must be removed when the invariant dies** — if the code is rewritten such that the rule no longer applies, delete the comment. `recheck` flags inline comments near heavily-rewritten code for review.

### Prefer author-dismissal rationale verbatim

When the comment comes from an author rebutting a review bot ("Dismissed — intentional because X"), use the author's explanation almost verbatim. The author has already written the invariant in the most precise form; rewriting it tends to lose nuance. Strip the "Dismissed —" prefix, keep the reasoning, add the provenance cite.

Good source (PR author comment):
> *"Dismissed — intentional by design. `DataItem.value` is typed `string | null` where `null` is a first-class state representing a deleted secret. Coalescing `null → ''` inside `makeDataItem` would silently convert deletions into empty-string upserts."*

Resulting inline comment:

```typescript
// NOTE to review bots: `DataItem.value` is typed `string | null` where `null` is
// a first-class state representing a deleted secret. Do NOT coalesce null → '' —
// that silently converts deletions into empty-string upserts. (Bugbot dismissed in PR #733)
const item = makeDataItem(key, value);
```

Format:

```javascript
// WARNING: MemoryStorageAdapter preserves object references intentionally.
// Do NOT change === to deepEqual here. (See PR #748)
if (prev === next) {
  ...
}
```

## Token budget (BUGBOT.md only)

Fewer rules = more attention per rule.

- **Under 400 words per file** — ideal.
- **Under 600 words** — acceptable.
- **Over 800 words** — too fat; audit and slim down.

Worst-case load (the three deepest-nested BUGBOT.md files combined, which is what the bot sees on a deep-module PR) should stay under 2000 tokens.
