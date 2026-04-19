# Review & QA at the Times of AI-Assisted Development

*5 minutes. Tight delivery — one idea per slide, no detours. Arc: gap → solution → evidence → thesis → call to action.*

---

## Slide 1: Title

"How do you review a PR today?"

*(beat)*

"You read the diff, open Claude, and ask: 'Race conditions?' 'What if this is empty?' That's the new manual. Better than what we had — but it's still you, every time, remembering which questions to ask."

---

## Slide 2: Three Tiers of Review Today

*(gesture across the three columns, left to right)*

"Today there are actually three tiers. On the left — the generic bot. Bugbot, CodeRabbit, out of the box. Runs on every PR, reads every line — but gives you generic feedback. 'Consider adding error handling.' It starts from zero every run. No memory."

"In the middle — the new manual. You, the human, reading the diff and asking Claude the smart questions. You remember the war stories. You know the tradeoffs. But it's still manual, every PR, and you have no time."

*(point to the red-bordered third column)*

"On the right — the bot with memory. Runs on every PR, fully automatic, but remembers your team's specific pitfalls."

*(point to the punchline)*

"We can't create time for people. We can create memory for the bot."

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

"PR 735 — Bugbot flagged the same file repeatedly, author kept dismissing: React's useState setters are referentially stable; including them in deps is a no-op. One author-dismissal became one scope rule — the bot stops re-flagging the pattern."

"PR 760 — a reviewer asked why AIPanelTemplate had duplicated helpers. Author replied: the template is a runtime-evaluated JS string and literally *can't* import TypeScript modules. The duplication is structural. That rationale became an inline comment, pinned to the file, so the next reviewer and the bot both see it immediately."

"PR 741 — useState captures values one frame late. That lesson went into the coding assistant."

"The bot doesn't just know what's wrong. It knows what's intentionally right."

---

## Slide 8: What We Shipped

"1,670 merged PRs mined across three repos — a React TypeScript monorepo, a Python FastAPI backend, and a public OSS Scala Elasticsearch plugin. 20 BUGBOT files, 112 rules total, 27 lessons. Every rule under budget."

*(beat)*

"Running the v0.7 harvest cold on those three repos surfaced three things. First: on the frontend, one module carried 442 of 1,067 substantive review comments — 41% of all review activity — with no scope file. Intuition-based hierarchy was just wrong. Second: on the backend, the bot filter would have misclassified 308 GitHub-Copilot comments as 'substantive human feedback' because Copilot's login has no `[bot]` suffix. Caught and fixed before the skill went public. Third: across all three stacks, 30 to 52% of rules traced directly to author-dismissals of bot findings. Same pattern, three different review bots, three different languages."

*(pause)*

"All three became skill doctrine. The skill's own rules made the skill better."

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

"The LLM wiki gives it documentation. This gives it the scar tissue."

---

## Slide 12: The Skill Commands

*(gesture down the table)*

"Six commands + one workflow. Setup runs once — mines your PRs, creates everything. The harvest Action is fully automatic — fires on every merge, no human needed."

"Harvest is the human-in-the-loop step — you classify and place. Rebalance ranks modules by real review activity — it's what caught our miscalibrated hierarchy. Recheck verifies every rule still references code that exists. Audit runs quarterly — prunes what's stale, graduates what's now lint-able."

*(point to the legend)*

"One automated, five human-triggered. The system surfaces the knowledge — you decide what to keep."

---

## Slide 13: FAQ

*(this slide is a safety net — advance to it during Q&A if a question matches, or skip if time is tight)*

**Won't it rot?** "Quarterly audit. Rules that never trigger get removed. The harvest keeps fresh ones coming in. Entropy is real — the audit cadence is the answer."

**Why not linter rules?** "If it can be linted, lint it — and remove it from BUGBOT.md. BUGBOT is for fuzzy knowledge that needs understanding intent."

**Token creep?** "400 words per file, 2,000 tokens worst case. Classification is the enforcer. Rules that don't fit a bin don't get added."

**Cross-cutting rules?** "Root BUGBOT.md. The bot traverses upward — every PR sees the root."

**Does it work with X reviewer?** "Anything that reads repo files. Cursor Bugbot natively. Others via LESSONS.md and inline comments."

**Rejected suggestions?** "Not rules. Only adopted corrections and real-pitfall warnings make it through."

**Module renames / big refactors?** "The BUGBOT.md file moves with git mv — that's the easy part. The hard part is the rules *inside* it may reference paths and functions that just changed. After a big refactor: grep every BUGBOT.md for stale paths, update scopeRules in the harvest workflow, check inline comments didn't lose context. LESSONS.md is path-agnostic so it's unaffected. Add this to your refactor PR checklist — don't wait for the quarterly audit."

**Noisy?** "Only fires on substantive human comments. Expect 1-2 harvests per week on a busy repo."

*(pause)*

"Thank you."

---

*Post-scriptum bonus slides — show only if time allows or if the audience asks about testing/QA.*

---

## Slide 14: LLM Vision-Based Automated Testing

*(advance only if there's interest — this is future research, not shipped work)*

"One more thing. A direction we're exploring."

"Instead of writing Playwright selectors that break every time someone renames a button, what if the test just said 'click submit' — and an AI model *looked at the screen* and found it?"

*(point to the two cards)*

"Two open-source building blocks. Midscene.js — plugs into our existing Playwright setup, replaces selectors with natural language. UI-TARS — a vision model trained specifically to interact with UIs. Sees screenshots, plans actions, executes."

*(point to the callout)*

"Both run on our hardware. No cloud, no licensing, no data leaves the network."

---

## Slide 15: Promising, But Needs Validation

*(two columns — keep it honest)*

"What looks good: it runs on our RTX 6000, handles drag and drop, the ecosystem is moving fast. Test specs are readable by non-engineers — QA and product can write them. And tests survive UI refactors that break selectors."

"What we need to test: speed — can it run a full suite in CI time? Determinism — same result every run? Our specific UIs — link charts, record viewers. And GPU contention with dev workloads."

"This is research, not a recommendation. But the direction is clear — tests that understand intent, not DOM structure."
