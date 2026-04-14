# Review & QA at the Times of AI-Assisted Development

*5 minutes. Tight delivery — one idea per slide, no detours. Arc: gap → solution → evidence → thesis → call to action.*

---

## Slide 1: Title

"How do you review a PR today?"

*(beat)*

"You read the diff, open Claude, and ask: 'Race conditions?' 'What if this is empty?' That's the new manual. Better than what we had — but it's still you, every time, remembering which questions to ask."

---

## Slide 2: The New Manual

*(gesture to the two columns)*

"Two reviewers. The human remembers the war stories, knows the tradeoffs — but has no time. The bot runs on every PR, reads every line — but starts from zero every run. Zero memory of what went wrong."

*(point to the bottom line)*

"The human has the context but not the time. The bot has the time but not the context. That's the gap."

---

## Slide 3: Three Memory Layers

"So what if you gave the bot memory? Three layers, each hitting at a different moment."

*(point to each row)*

"BUGBOT.md — rules the bot reads at review time. 'Never use Promise.all on unbounded arrays.' Specific. Checkable against a diff."

"LESSONS.md — read by the coding assistant before the developer writes code. The upstream fix."

"Inline comments — pinned to one file. The bot sees them only when that file is in the diff. Zero token waste."

---

## Slide 4: Hierarchical Scoping

"The memory is scoped to the code it protects."

*(point to the tree, then the bars)*

"Global rules at the root. App-level one down. Module-level for the complex areas. The bot traverses upward — a LinkChart change gets three layers, a package change gets two."

"Under 400 words per file. Because a reviewer with too much context stops paying attention."

---

## Slide 5: The Feedback Loop

"Where does the memory come from? From the review comments you're already writing. 'Be careful here, this caused an incident.' 'Don't change this — intentional tradeoff.'"

"Those live on merged PRs that nobody reads again."

*(gesture across the five steps)*

"A GitHub Action fires on every merge, extracts human comments, posts a harvest proposal. You classify with one command. The bot enforces it on every future PR."

---

## Slide 6: Rule Classification

*(sweep across the five cards)*

"Not everything goes in the same place. Can the bot check it? BUGBOT.md. Informs developers? LESSONS.md. One file? Inline comment. Duplicate? Merge. Pattern fixed? Remove."

*(point to the warning)*

"The number one failure mode is dumping everything into BUGBOT.md. This classification keeps the bot sharp."

---

## Slide 7: Real War Stories

*(point to each card — brisk pace)*

"PR 781 — Promise.all on 200 files, OOM. Now the bot flags unbounded parallel operations."

"PR 775 — an LLM renamed a CSS class, collapsed an unrelated panel. Now the bot flags shared class name changes."

"PR 748 — the bot *itself* flagged `===` as a bug. A senior said: 'That's intentional — reference equality prevents Redux re-dispatches.' Now there's an inline comment protecting it."

"PR 741 — useState captures values one frame late. That lesson went into the coding assistant."

"The bot doesn't just know what's wrong. It knows what's intentionally right."

---

## Slide 8: What We Shipped

"22 war stories from 50 merged PRs. 5 BUGBOT files across the monorepo. 6 inline comments. One GitHub Action."

*(beat)*

"On its first review, Bugbot caught a real bug in the harvest workflow itself. The system improved itself."

*(pause)*

"There's just one problem — this PR is stuck in review."

*(let the laugh land)*

---

## Slide 9: Two Kinds of Knowledge

*(point to the two columns)*

"There's architectural knowledge — written at decision time, forward-looking, lives in ADRs. 'We chose epoch-based concurrency guards for graph mutations.'"

"And shadow knowledge — emerges after the fact, backward-looking, lives in PR comments and people's heads. 'If you bypass that epoch check, pending counts go negative and loading spinners stay forever.'"

"ADRs document the skeleton. Shadow knowledge is the muscle memory."

*(pause)*

"And it walks out the door when someone leaves."

---

## Slide 10: The Dual Flywheel

*(gesture across the three cards)*

"Coding gets smarter — the assistant stops suggesting dangerous patterns. Reviewing gets smarter — the bot catches what no human has time to check. Both compound. Every mistake becomes a permanent rule."

*(point to the red crisis box)*

"AI tools have 10x'd code production. Review throughput hasn't scaled. We're producing code faster than we can safely review it."

*(point to the three shifts)*

"What must change: comments become rules — write for the bot. Detailed rejections beat quick approvals. Junior mistakes are data — raw material for new rules."

---

## Slide 11: Open Source

"This is open source. One command to install. Any GitHub repo, any language."

*(pause)*

"Today the bot asks generic questions. Tomorrow it asks the right questions — because it remembers what went wrong."

"The LLM wiki gives it documentation. This gives it the battle scars."

*(pause)*

"Thank you."
