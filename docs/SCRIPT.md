# Review and QA at the Times of AI-Assisted Development

*10 minutes. Delivery: conversational, building an argument. Each slide adds one idea.*

---

## Slide 1: Title

"Let me ask you something. When was the last time you reviewed a PR line by line?"

*(pause)*

"Not skimmed. Not scrolled. Actually read every line, thought about every change."

*(pause)*

"If you're honest... it's been a while. And that's not because you're lazy. It's because the game changed."

---

## Slide 2: The Problem

"AI coding tools have changed what a PR looks like. A developer with Claude Code or Copilot produces five PRs where they used to produce one. The PRs are bigger. They touch more files. They move faster."

"But the reviewer? The reviewer is still one human. With one pair of eyes. And a calendar full of meetings."

"So what happens? We skim. We pattern-match. We rubber-stamp things we should be scrutinizing. We approve code that looks right but isn't safe."

*(pause)*

"We are producing code faster than we can safely review it. That's the actual crisis. Not AI writing bad code. AI writing plausible code that nobody has time to check."

---

## Slide 3: Three Memory Layers

"So the reviewer needs tools. And not just one kind of tool."

"Think about it as a toolbelt. The modern AI-assisted reviewer has four categories of tools."

*(gesture across)*

"First -- broad tools. Clean code scans. Correctness checks. Linting on steroids. These cover surface area. They catch the obvious stuff so the human doesn't have to."

"Second -- narrow tools. Deep analysis. Memory management patterns. Computational complexity. The stuff that requires actually understanding what the code does, not just what it looks like."

"Third -- recon tools. Module interaction mapping. Network call mapping. Dependency graphs. These answer the question: 'what does this change actually touch?'"

"And fourth -- the one nobody's building..."

*(pause)*

"Memory."

"Memory of what went wrong in the past. Memory of the review comment a senior engineer left three months ago on a merged PR that nobody will ever read again."

---

## Slide 4: Hierarchical Scoping

"So how do you give a bot memory?"

"You can't just dump everything into one file. We tried that. Fifty rules in one config. The bot reads them all, pays attention to none of them."

"Instead -- you scope the memory to where it matters."

*(point to the tree)*

"Global rules at the root. Every PR sees them. App-level rules one level down. Module-level rules for complex areas like the link chart. Package rules for shared code."

"The bot traverses upward. A change to the link chart editor gets three layers of memory. A simple package version bump gets two. The right context for the right change."

*(point to the token bars)*

"Under 400 words per file. Under 2,000 tokens worst case. Because memory without focus is just noise."

---

## Slide 5: The Feedback Loop

"Now here's the question: where does the memory come from?"

"It comes from the humans. From the review comments that contain the real wisdom. 'Be careful here, this caused a production incident last quarter.' 'Don't change this -- it's intentional.' 'We tried that approach in Q3 and reverted it.'"

"The problem is: those comments live on merged PRs. They're write-once, read-never."

*(walk through the steps)*

"So we built a feedback loop. A GitHub Action fires on every merge. It extracts the substantive human review comments -- filters out the bots, the 'LGTM's, the checkbox checklists. It posts a structured harvest summary."

"Then someone runs one command. The comments get classified and placed where they belong."

"The bot uses them on the next review. And the loop continues."

"The reviewer teaches the bot once. The bot enforces it forever."

---

## Slide 6: Rule Classification

"But here's the part that requires human intelligence. Not every comment belongs in the same place."

"Some lessons are things the bot can enforce on a diff. 'Don't use Promise.all on unbounded arrays.' That's a BUGBOT.md rule. The bot sees the pattern, it flags it."

"Some lessons apply to one file. 'This adapter uses reference equality intentionally. Don't fix it.' That's an inline comment. Pinned to the source code. The bot sees it only when that file is in the diff."

"Some lessons are universal principles. 'In-memory state is a cache, not a source of truth.' That's for LESSONS.md. The coding assistant reads it before the developer writes code."

*(pause)*

"This classification -- this is the human job. This is what can't be automated. Deciding what matters, where it belongs, and what to throw away. Keeping the memory focused. Curating the tribal wisdom."

"We reserve human intelligence for regulation. For engineering the context. For calling the decision to drop the less important things so the bot stays sharp."

---

## Slide 7: Real War Stories

"Let me show you what this looks like in practice."

*(point to each card)*

"PR 781. `Promise.all` on 200 file uploads. Production OOM. Three-line fix. Now a bot rule. It will never approve that pattern again."

"PR 775. An LLM changed a CSS class name in the sidebar. It collapsed a completely unrelated component. Nobody caught it in review. Now there's a rule: flag shared CSS class changes."

"PR 748. The bot itself flagged a triple-equals as a bug. A senior engineer said: 'That's intentional.' That comment is now an inline code comment. The bot won't flag it again -- and neither will the next junior dev who thinks it's wrong."

"PR 741. `useState` captures values one frame late. You need `useRef` for synchronous capture. That's a lesson that went into the coding assistant's context. The next developer who asks for help with state transitions gets the right pattern from the start."

"That last one -- that's the byproduct. The memory we build for the reviewer bleeds into the coding tools. The developer's assistant reads the lessons before writing code. The wisdom flows upstream."

---

## Slide 8: What We Shipped

"We mined 50 merged PRs. Found 22 war stories worth keeping. Created hierarchical rule files across the monorepo. Installed the automated harvest loop."

*(pause)*

"On its first review, Bugbot caught a real bug in the harvest workflow itself. The system's own rules made the system better."

*(beat)*

"There's just one problem. The PR that introduces all of this..."

*(pause)*

"...is stuck in review."

*(let the laugh land)*

---

## Slide 9: Two Kinds of Knowledge

"I want to name something that I think our industry doesn't talk about enough."

"We have ADRs. Architecture Decision Records. They capture what was decided and why. They're written at decision time. They're forward-looking."

"But the most dangerous knowledge in a codebase isn't what was decided. It's what went wrong afterward. The edge case nobody predicted. The interaction between two modules that wasn't in any design doc. The workaround for an external API quirk that you only discover after three days of debugging."

"I call this shadow knowledge. It emerges after the fact. It's unknowable at decision time. It lives in PR comments, in Slack threads, in people's heads."

*(pause)*

"ADRs document the skeleton. Shadow knowledge is the muscle memory."

*(pause)*

"And it walks out the door when someone leaves."

"What we're building is a way to make shadow knowledge durable. To capture it where it's created -- in PR reviews -- and place it where it's consumed -- in the bot's context window and the developer's IDE."

---

## Slide 10: The Dual Flywheel

"So the picture is this."

"The reviewer gets sharper. Broad tools for surface coverage. Narrow tools for deep analysis. Recon tools for mapping impact. And memory -- curated, scoped, focused memory of what went wrong before."

"The coding assistant gets smarter. It reads the lessons before suggesting code. It stops recommending patterns the team already learned are dangerous."

"Both compound over time. Every review cycle produces new memory. Every mistake becomes a permanent rule. Every senior engineer's comment becomes organizational infrastructure."

*(point to the crisis box)*

"The PR that introduces this system -- PR 788 -- has been waiting for a human reviewer for days. The system designed to fix the review bottleneck is stuck in the review bottleneck."

*(pause)*

"That's not irony. That's the problem statement in one sentence."

*(point to the attitude shifts)*

"What has to change? Three things. Comments become rules, not conversation -- write for the bot, not a colleague. Detailed rejections are more valuable than quick approvals -- every 'be careful because' becomes permanent. And junior mistakes are data, not failures -- they're the raw material for new rules."

---

## Slide 11: Open Source

"We open-sourced all of this. It's a Claude Code skill. One command to install. Works with any GitHub repo."

*(pause)*

"The reviewer doesn't go line by line any longer. The reviewer is an engineer with a toolbelt -- broad tools, narrow tools, recon tools, and memory."

"We give the bot the memory. We scope it to where it belongs. We let it bleed into the coding tools. And we reserve human intelligence for the one thing it's irreplaceable for: deciding what matters."

*(pause)*

"And if you're a reviewer on PR 788... now you know what it does."

*(smile)*

"Thank you."
