# AI Code Review Knowledge System — Presentation Script

*Delivery: Start with why. Pause for effect. Speak to one person, not a room. Let the silence do the work.*

---

## Slide 1: Title

"How many of you have reviewed the same type of bug... twice?"

*(pause, let hands go up)*

"Three times?"

*(pause)*

"This talk is about making sure that never happens again."

---

## Slide 2: The Problem

"Let me tell you what's actually happening in our code review process right now."

"We have four problems, and they're all connected."

*(point to each card)*

"First -- our AI reviewers have no memory. Cursor Bugbot, CodeRabbit, Copilot -- they review every single PR from a blank slate. They don't know what happened last month. They don't know what hurt us."

"Second -- the knowledge dies. A senior engineer writes the most brilliant review comment of their career... and it lives on a merged PR that nobody will ever open again."

"Third -- when we try to fix this by dumping rules into a config file, we make it worse. Fifty rules competing for attention means zero rules getting attention."

"And fourth -- there's no loop. Even when we learn something, there's no systematic way to feed it back into the process. It stays in someone's head. Or in a Slack thread. Or nowhere."

---

## Slide 3: Three Memory Layers

"So here's what we built. Three layers. Each one optimized for a different moment in the development cycle."

*(gesture across the three rows)*

"Layer one -- the bot's memory. BUGBOT.md files that Bugbot reads every time it reviews a PR. These are rules the bot can actually enforce. 'Don't use Promise.all on unbounded arrays.' The bot sees the diff, it checks the rule, it flags it."

"Layer two -- the developer's memory. LESSONS.md. Claude Code and Cursor read this before you start writing code. It's the 'why' behind the patterns. Things the bot can't check, but you should know."

"Layer three -- file memory. Inline comments. Placed directly in the source code, exactly where they matter. The bot only sees them when that specific file shows up in a PR. Most targeted. Zero waste."

*(pause)*

"The key insight is: not everything belongs in the same place. Put the wrong knowledge in the wrong layer, and it either wastes the bot's attention or nobody sees it."

---

## Slide 4: Hierarchical Scoping

"Now -- the BUGBOT.md files aren't flat. They're hierarchical."

*(point to the tree)*

"There's a global file at the root. Every PR sees it. Cross-cutting concerns. Then there's one per app. One per complex module. One for shared packages."

"The bot traverses upward from the file being changed. So if you're touching the link chart module, you get three layers of rules -- the module's, the app's, and the global. If you're making a simple package change, you get two. No wasted tokens."

*(point to the token bars)*

"We keep each file under 400 words. Worst case, the bot sees about 1,700 tokens of rules. That's the sweet spot -- enough context to be useful, not so much that it drowns."

---

## Slide 5: The Feedback Loop

"Here's the part that makes this self-sustaining."

*(walk through the five steps)*

"A PR gets merged. That's step one. Step two -- a GitHub Action fires automatically. It looks at the human review comments on that PR. Not the bot comments. The human ones. It filters out the 'LGTM's and the checkboxes. It finds the substantive feedback."

"Step three -- it posts a structured summary right on the merged PR. 'Here are three comments worth capturing. Here are the files they affected. Here are the BUGBOT.md scopes.'"

"Step four -- someone on the team runs one command. `/pr-war-stories harvest`. It classifies each comment and places it in the right layer."

"Step five -- the bot is smarter. The next PR that touches that code gets reviewed against the new rule."

*(point to the curved return arrow)*

"And the loop continues. Every merged PR with substantive review comments automatically produces a harvest candidate. Nothing falls through the cracks."

---

## Slide 6: Rule Classification

"Not every lesson is a BUGBOT.md rule. This is the most important thing we learned."

"Every piece of knowledge gets triaged. Can the bot check it against a diff? Yes -- it goes in BUGBOT.md. No? Does it apply to one file? Then it's an inline comment. Is it educational, about why something works the way it does? LESSONS.md."

"Overlapping with another rule? Merge them. The pattern was fixed? Remove it."

*(pause)*

"The number one failure mode is dumping everything into BUGBOT.md. We tried it. The bot started ignoring the important rules because they were buried in noise. This classification prevents that."

---

## Slide 7: Real War Stories

"These aren't hypothetical. These are from our actual PRs."

*(point to each card)*

"PR 781. We had `Promise.all` on 200 file uploads. Production OOM. The fix was a three-line change to use a concurrency limiter. Now it's a BUGBOT.md rule. The bot will never let that pattern through again."

"PR 775. An LLM-generated CSS change in the sidebar collapsed the schema editor to zero height. A shared class name. Nobody caught it in review. Now there's a rule: flag CSS changes to class names used in multiple components."

"PR 748. The bot itself flagged a triple-equals check as a bug. A senior engineer explained: 'That's intentional. The adapter preserves object references. Don't change it.' That comment is now an inline code comment, right above the line."

"PR 741. A timing bug. `useState` captures values one frame late. We needed `useRef` for synchronous capture. That's a universal lesson -- it went into LESSONS.md."

---

## Slide 8: What We Shipped

"Let me give you the numbers."

"We mined 50 merged PRs. Extracted 22 war stories. Created 5 BUGBOT.md files across the monorepo. Placed 6 inline comments in source files. Installed one GitHub Action for the automated harvest."

*(pause, point to the proof box)*

"And here's my favorite part. On its very first review of our code, Bugbot caught a real bug -- in the harvest workflow we built to teach it. The scope detection used `else if` instead of `if`, so linkchart files were missing parent scope rules."

*(pause for effect)*

"The system's own rules made the system better. That's when we knew this works."

*(beat)*

"There's just one problem. The PR that introduces this entire system..."

*(pause)*

"...is stuck in review."

*(let the laugh land)*

---

## Slide 9: Two Kinds of Knowledge

"I want to step back and talk about something bigger."

"There are two kinds of knowledge in every codebase."

*(point left)*

"Architectural knowledge. The stuff we document intentionally. ADRs, design docs. 'We chose this approach because of these tradeoffs.' It's written at decision time. It's forward-looking. It captures what we predicted would happen."

*(point right)*

"And then there's what I call shadow knowledge. The stuff that emerges after the fact. The things we couldn't have predicted. 'If you bypass the epoch check, pending counts go negative and the UI shows stale loading forever.' Nobody wrote that in an ADR. Someone discovered it the hard way."

*(pause)*

"ADRs document the skeleton. Shadow knowledge is the muscle memory."

*(pause)*

"It only exists in the heads of people who've been burned."

*(longer pause)*

"And it walks out the door when they leave."

---

## Slide 10: The Dual Flywheel

"So what does this actually change?"

"Two things compound at the same time. The coding assistant gets smarter -- it reads LESSONS.md before suggesting code, so it stops recommending patterns your team already learned are dangerous. And the reviewer gets smarter -- it reads BUGBOT.md rules scoped to the exact directory being changed."

*(point to the crisis box)*

"Here's why this matters right now. AI tools have 10x'd our code production. But review throughput hasn't scaled. Our senior engineers are the bottleneck. They're drowning in PRs. They're rubber-stamping things they should be scrutinizing."

"We are producing code faster than we can safely review it."

*(pause)*

"I'll give you a real example. The PR that introduces this entire system -- the BUGBOT.md files, the LESSONS.md, the harvest workflow, all the war stories we just talked about -- PR 788. It's been open for days."

*(pause)*

"It's waiting for a human reviewer."

*(pause)*

"The system designed to fix the review bottleneck... is stuck in the review bottleneck."

*(let it sink in)*

"That's not a joke. That's the problem statement in one sentence."

*(continue with the attitude shifts)*

"But it requires three changes from us. One -- our PR comments become rules, not conversation. Write for the bot, not a colleague. Two -- a detailed rejection is more valuable than a quick approval. Every 'be careful because...' becomes permanent memory. Three -- junior mistakes are data, not failures. They're the raw material for new rules."

---

## Slide 11: Open Source

"We open-sourced all of this."

"It's a Claude Code skill called `pr-war-stories`. One command to install. One command to bootstrap any repository."

"It works with Cursor Bugbot, any GitHub repo, any language."

*(pause)*

"Because institutional knowledge should be infrastructure, not folklore."

*(beat)*

"And if you're a reviewer on PR 788..."

*(smile)*

"...now you know what it does."

*(pause)*

"Thank you."
