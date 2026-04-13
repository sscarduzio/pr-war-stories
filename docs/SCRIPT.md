# Review and QA at the Times of AI-Assisted Development

*10 minutes. Delivery: conversational, building an argument. Each slide adds one idea.*

---

## Slide 1: Title

"How do you review a PR today? Be honest."

*(pause)*

"You check out the branch. You read the diff. And then you open Claude or ChatGPT and you ask: 'Does this have race conditions?' 'Is this SQL injection safe?' 'What happens if this list is empty?'"

"That's the new manual. We replaced reading line by line with asking an LLM generic questions. And it works. It's better than what we had."

"But it's still manual. It's still you, every time, remembering which questions to ask."

---

## Slide 2: The Problem

"Meanwhile, the automated reviewer -- Bugbot, CodeRabbit, whatever you use -- runs on every PR. No human in the loop. Fully automatic."

"But here's the thing. Every time it runs, it starts from zero. The code is new to it. It doesn't know your architecture. It doesn't know your tradeoffs. It doesn't know that the last three people who touched that module all introduced the same bug."

"It has no memory."

*(pause)*

"So what does it do? It gives you generic feedback. 'Consider adding error handling.' 'This function is complex.' Things you already know. Things that don't help."

"You -- the human -- you're asking the right questions because you remember the war stories. The bot is asking the wrong questions because it doesn't."

*(pause)*

"The human has the context but not the time. The bot has the time but not the context. That's the gap."

---

## Slide 3: Three Memory Layers

"So what if we gave the bot memory?"

"Not generic knowledge. Not 'here are best practices for React.' Specific memory. Your team's pitfalls. Your codebase's tradeoffs. The things that actually go wrong here."

*(gesture across the three rows)*

"We built three layers. Each one hits at a different moment."

"Layer one -- BUGBOT.md. Rules the bot reads at review time. 'Don't use Promise.all on unbounded arrays.' 'The wsUpdateStart mutex must always pair with wsUpdateFinish on all code paths.' Specific. Actionable. Things the bot can check against a diff."

"Layer two -- LESSONS.md. Read by the coding assistant before the developer writes code. The upstream fix. The developer's assistant stops suggesting patterns the team already learned are dangerous."

"Layer three -- inline comments. Pinned to one file. The bot sees them only when that file is in the diff. 'This adapter uses reference equality intentionally. Don't fix it.'"

"The memory bleeds into the coding tools as a byproduct. But the primary consumer is the automated reviewer."

---

## Slide 4: Hierarchical Scoping

"The memory isn't flat. It's scoped to the code it protects."

*(point to the tree)*

"Global rules at the root -- cross-cutting concerns every PR should check. App-level rules one level down. Module-level rules for the complex areas. Package rules for shared code."

"The bot traverses upward from the file being changed. Link chart changes get three layers of memory. A simple package bump gets two. The right rules for the right change."

*(point to the token bars)*

"Under 400 words per file. Under 2,000 tokens worst case. Because an automated reviewer with too much context is the same as one with no context. It stops paying attention."

---

## Slide 5: The Feedback Loop

"Where does the memory come from?"

"From you. From the questions you're already asking the LLM when you review PRs. From the review comments where you explain why something is wrong. 'Be careful here, this caused a production incident.' 'Don't change this, it's an intentional tradeoff.'"

"Those comments are the most reviewer-optimized guidance that exists. They're written by humans who got burned, for other humans who are about to make the same mistake."

"But they live on merged PRs. They're not indexed. They don't belong to the repo. They're left behind."

*(walk through the steps)*

"So we built a harvest loop. A GitHub Action fires on every merge. It extracts the substantive human comments. Posts a structured summary. You run one command to classify and place them."

"The reviewer teaches the bot once. The bot enforces it on every future PR."

---

## Slide 6: Rule Classification

"But not everything goes in the same place. This is the part that requires human judgment."

"Can the bot check it on a diff? That's a BUGBOT.md rule. Does it apply to one file? Inline comment. Is it a universal principle -- the 'why' behind a pattern? LESSONS.md."

"And here's what's equally important: what to throw away. What's stale. What's redundant. What's too noisy."

*(pause)*

"We reserve human intelligence for regulating the memory. Engineering the context. Keeping it focused. Dropping the things that don't matter so the bot stays sharp on the things that do."

"The bot is the walking encyclopedia. The human is the editor."

---

## Slide 7: Real War Stories

"Let me show you what the encyclopedia looks like."

*(point to each card)*

"PR 781. `Promise.all` on 200 files. OOM in production. Now the bot knows: flag unbounded parallel operations."

"PR 775. An LLM changed a shared CSS class name. Collapsed an unrelated component. Now the bot knows: flag CSS changes to names used in multiple files."

"PR 748. The bot itself flagged `===` as a bug. A senior engineer said: 'That's an intentional tradeoff. Reference equality prevents unnecessary Redux dispatches.' Now the bot knows the tradeoff is valid."

"PR 741. `useState` captures values one frame late. You need `useRef`. That lesson went into the coding assistant. The next developer who asks for help gets the right pattern from the start."

"That's the key. The bot doesn't just know what's wrong. It knows what's intentionally right. It knows the valid tradeoffs."

---

## Slide 8: What We Shipped

"We mined 50 merged PRs. Found 22 war stories worth keeping. Created rule files scoped across the monorepo. Installed the automated harvest."

"On its first review, Bugbot caught a real bug in the workflow we built to teach it. The system improved itself."

*(beat)*

"There's just one problem. The PR that introduces all of this..."

*(pause)*

"...is stuck in review."

*(let the laugh land)*

---

## Slide 9: Two Kinds of Knowledge

"I want to name something the industry is getting half right."

"There's a parallel effort right now around what Karpathy calls the 'LLM wiki' -- a whole-product-scope knowledge base. Documentation, architecture, API specs. All indexable. All queryable by AI agents. And that's important work."

"But here's what it doesn't capture."

*(pause)*

"The review comment that says 'don't do it this way, we tried it in Q3 and reverted.' The explanation of why a workaround exists. The warning about an external API quirk that's not in any documentation because the vendor doesn't know about it."

"The LLM wiki gives the bot documentation. It tells the bot how things work."

"PR review comments give the bot operational guidance. They tell the bot what goes wrong. What the valid tradeoffs are. Where the landmines are buried."

"It's the most tailored context a reviewer agent could have. And nobody's capturing it."

*(pause)*

"ADRs document the skeleton. The LLM wiki documents the organs. Shadow knowledge -- the stuff that emerges from PR reviews -- is the muscle memory."

"And it walks out the door when someone leaves."

---

## Slide 10: The Dual Flywheel

"So the picture is this."

"The automated reviewer becomes a walking encyclopedia. Not of generic best practices -- of your team's specific pitfalls, your codebase's valid tradeoffs, your production's actual failure modes."

"The coding assistant becomes an upstream filter. It reads the lessons before suggesting code. Fewer bad patterns make it into PRs in the first place."

"Both compound over time. Every review cycle feeds new memory. Every mistake becomes a permanent rule. Every senior engineer's comment becomes organizational infrastructure."

*(point to the crisis box)*

"The PR that introduces this system -- PR 788 -- has been waiting for a human reviewer. The system designed to give the bot memory... is waiting for a human who doesn't have the time."

*(pause)*

"That's the problem statement in one sentence."

*(point to the attitude shifts)*

"What has to change? Three things. Comments become rules -- write for the bot, not a colleague. Detailed rejections are more valuable than quick approvals. And junior mistakes are data -- they're the raw material for new rules."

---

## Slide 11: Open Source

"We open-sourced all of this. It's a Claude Code skill. One command to install. Works with any GitHub repo."

*(pause)*

"Today, you review PRs by asking an LLM generic questions. That's the new manual."

"Tomorrow, the automated reviewer asks the right questions because it remembers what went wrong. It knows the pitfalls. It knows the valid tradeoffs. It's the walking encyclopedia of everything your team has learned."

"The LLM wiki gives it documentation. We give it the battle scars."

"And we reserve human intelligence for the one thing it's irreplaceable for: deciding what matters and what to forget."

*(pause)*

"And if you're a reviewer on PR 788... now you know what it does."

*(smile)*

"Thank you."
