# Show HN draft — final copy for submission

Below is a ready-to-submit draft. Three variants for the title; body is one long text per HN convention (no markdown rendered by HN).

---

## Title options (pick one)

**A.** *Show HN: Mining 759 PR reviews taught my AI reviewer not to re-flag the same bugs*

**B.** *Show HN: I ran my PR-review harvester on my own repos and it found a bug in itself*

**C.** *Show HN: Distill PR review comments into rules your AI code reviewer actually enforces*

My pick: **A**. It leads with the empirical finding and the villain (re-flagging the same bugs), and earns the HN "Show" prefix with concrete numbers rather than tool vocabulary. B is punchier but the self-deprecation wears out; C is accurate but sounds like any other AI-review product.

---

## Body

Every PR review is a debate about architecture, tradeoffs, style, and quality. Then the PR merges and the debate dies. The next PR touching the same code has Cursor Bugbot or CodeRabbit re-discovering the same arguments, and the author dismissing them again with the same rationale they wrote three months ago.

I built pr-war-stories to fix this. It's a Claude Code skill that mines merged PRs for institutional knowledge and distills it into three complementary layers — `.cursor/BUGBOT.md` for the review bot, `LESSONS.md` for the IDE assistant, and inline source comments for humans and bots that read code directly. Every rule lives in exactly one layer.

The core doctrine is short:

1. Rules go where the reader is. Putting a bot-checkable rule in LESSONS.md means the bot never sees it; putting a file-specific invariant in BUGBOT.md wastes attention on 99% of PRs that don't touch that file.

2. Token budget beats rule count. Each `BUGBOT.md` caps at ~400 words. 50-rule config files fail because every rule competes for the bot's attention.

3. A GitHub Action closes the loop: every merged PR with substantive human review comments produces a harvest proposal. `/pr-war-stories harvest` classifies the new lessons. The bot gets smarter on the next PR.

## What surprised me

I ran the skill on three production repos: a React TS frontend (415 merged PRs, 1,067 substantive review comments), a FastAPI/Python backend (344 PRs, 1,685 comments), and — for independent validation — a public OSS Elasticsearch plugin in Scala/JVM that I also maintain (755 PRs spanning 12 years, completely different stack from the first two).

Four findings that changed how I think about this problem:

**Author dismissals of bot findings are the single highest-yield source of rule material.** When a senior engineer replies *"Dismissed — X is intentional because Y"* to a review bot, X is a pre-written invariant with the rationale already attached. No interpretation needed; paste into an inline comment or a BUGBOT.md rule and move on. Compare that to reviewer suggestions, which need you to check whether the suggestion was adopted, whether it was a style nit, whether the team agreed — most don't clear that bar. The skill now harvests dismissals first. In the frontend repo, the single most-dismissed file had 42 author-dismissals, and roughly half of those were the same "`useState` setter is referentially stable, stop flagging it as a missing dep" pattern repeating. One scope-level rule (PR #735) silences all of them. On the Scala repo, **52% of all the rules the skill produced trace directly to author-dismissals** — the pattern replicates on a completely different stack.

**The initial module hierarchy was wrong in both repos.** I'd picked "complex-looking" modules intuitively at setup time. The data showed otherwise: the `Apps/` module accumulated 442 of the 1,067 frontend review comments (41% of all review activity) but had no scope file, while `Composer/` (13 comments) and `linkchart-nt/` (31) did. In the backend repo, `app/api/v1/apps/` (167 comments) had no scope while `relationships/` (29 comments, 1 rule) did. Rule of thumb now baked into the skill: rank modules by review-comment density, not by perceived complexity.

**I discovered a bug in my own harvest workflow — before it shipped.** GitHub's Copilot Code Review bot posts as login `Copilot` — no `[bot]` suffix, unlike every other bot. My filter was missing it. Had anyone installed the workflow with that filter, 308 Copilot comments in my backend repo alone would have been misclassified as "substantive human review input." The retrospective sweep caught this before the skill had shipped to any real user beyond me. Filter fixed in the skill template.

**What it costs: ~$0.30 – $0.83 and 77 minutes for a full setup + harvest.** Measured on the Scala repo: 175,023 total Claude Code tokens, 195 `gh` API calls, 11 files written. The automated GitHub Action on every merged PR runs for free (pure JavaScript, zero LLM calls) — you only spend Claude tokens when you manually run the slash-commands. Steady-state on a busy repo is 1–2 harvests per week at ~$0.03–$0.15 each. **The cost table is in the README** because I'd rather answer the question than hide it.

## What it isn't

It doesn't monitor production incidents. It doesn't auto-commit rules — every harvest produces a PR for human review. It doesn't edit your code; it only writes BUGBOT.md, LESSONS.md, and inline comments. It works with any GitHub repo in any language, but only Cursor Bugbot reads the BUGBOT.md hierarchy automatically — other review bots need their own wiring (I tested it on a repo that uses `coderabbitai` — the skill still writes correct artifacts, they just need a different consumer).

## Install

```
claude install-skill sscarduzio/pr-war-stories
/pr-war-stories setup
```

Source, doctrine, and the two real-repo harvests: https://github.com/sscarduzio/pr-war-stories

Landing page (neobrutalist, on purpose): https://sscarduzio.github.io/pr-war-stories

Happy to answer questions about the harvest heuristics, the three-layer architecture, or the token-budget math.

---

## Optional first comment (for self-posting a clarification)

A few things I expect will come up:

- **"Why not just use cursorrules / .coderabbit.yaml?"** Those are single-file config. The whole point of this skill is that a single file doesn't scale — rules fight for attention. The hierarchy + token budget is what makes it work.

- **"Isn't this just a linter?"** Linters catch syntactic and deterministic patterns. These rules are contextual — "this `===` is intentional because the upstream cache preserves identity; don't 'fix' it to deepEqual." No linter expresses that. The skill also explicitly graduates rules *out* of BUGBOT.md when they become lint-able — shrinking BUGBOT.md is a health signal.

- **"How do you avoid encoding rejected suggestions as rules?"** The harvest doctrine rejects them. A reviewer suggested X, author pushed back, team agreed on Y → that's a design decision, not a rule. Encoding it would make the bot fight the team.

- **"What stops this from being the same AI-slop-on-AI-slop cycle?"** The rules are mined from human review comments on real PRs. The skill writes them, but the provenance is human. Every rule cites a specific PR number so a future reader can audit why.

---

## Timing / logistics

- **Day & time:** Tuesday through Thursday, 8–10am PT. HN's algo favors discussion-friendly windows; avoid Monday mornings and Friday afternoons.
- **Before submitting:** make sure the repo has a clear README (done), the landing page works (done), and the install flow is rehearsed once. HN commenters will try `claude install-skill ...` within 5 minutes of seeing the post.
- **Don't submit the same day as a big launch:** check HN front page first; if the top 10 is packed with well-funded product launches, wait a day.
- **Reply to every comment in the first 2 hours.** HN rewards authors who engage. Keep replies short, direct, admit when you don't know something.

---

## What I'd emphasize in a tweet/x-post sibling

*"I built an AI code reviewer, then ran it on 3 repos (1,514 merged PRs across JS/Python/Scala) and found:*
*– 442 of 1067 review comments landed in 1 unscoped React module*
*– 308 Copilot comments would have leaked through my own bot-filter*
*– on a Scala OSS repo I harvested cold, 52% of rules came from author-dismissals*
*– full setup + harvest on 755 PRs: 175k tokens, 77min, ~$0.50. Action is free.*
*All findings + cost table back in the skill. → link"*

Thread format works better than the single post for this kind of "findings" content.
