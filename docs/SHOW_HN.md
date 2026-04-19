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

I ran a clean-slate `setup + harvest` on three production repos: a React TS frontend (415 merged PRs, uses Cursor Bugbot), a FastAPI/Python backend (500 PRs, uses Cursor Bugbot + Copilot Code Review), and a public OSS Elasticsearch plugin in Scala/JVM (755 PRs over 12 years, uses CodeRabbit). Uniform methodology, independently run, separately published — full artifacts for each are in [docs/case-studies/](https://github.com/sscarduzio/pr-war-stories/tree/main/docs/case-studies).

Four findings:

**Author-dismissals of bot findings are the primary harvest yield.** When a senior engineer replies *"Dismissed — X is intentional because Y"* to a review bot, X is a pre-written invariant with the rationale already attached. No interpretation needed; paste into an inline comment or a BUGBOT.md rule and move on. Compare that to reviewer suggestions, which need you to check whether the suggestion was adopted, whether it was a style nit, whether the team agreed — most don't clear that bar. Measured yield from author-dismissals: **36% of rules in the React frontend repo, 30% in the Python backend, 52% in the Scala plugin**. The skill now prioritises dismissals. On the frontend, the single most-dismissed file had 42 of them, about half were the same "`useState` setter is referentially stable, stop flagging it as a missing dep" pattern repeating. One scope-level rule silences them.

**The initial module hierarchy was wrong in both of my own repos.** I'd picked "complex-looking" modules intuitively at setup time. The data showed otherwise: the `components/Apps/` module in the frontend carried **442 of 1,067 substantive review comments (41% of all review activity)** but had no scope file, while less-touched modules did. Ranking modules by comment density — not by perceived complexity — is now baked into the skill's setup.

**I discovered a bug in my own harvest workflow — before it shipped.** GitHub's Copilot Code Review posts as login `Copilot` — no `[bot]` suffix, unlike every other bot. My filter was missing it. On the Python backend repo, **308 Copilot comments** would have been misclassified as human review input if the workflow had been running. Caught during the retrospective sweep, filter shipped in v0.7 before any public install.

**What it costs, measured across all three repos: ~$0.25–0.83 per one-shot setup+harvest, 12–77 minutes wall-clock.** Per-repo token counts (150k / 139k / 175k) are published in the README. The automated GitHub Action is free (pure JavaScript, no LLM). Steady-state on a busy repo is 1–2 harvests per week at ~$0.03–$0.15 each. I'd rather answer the cost question up front than hide it.

## What it isn't

It doesn't monitor production incidents. It doesn't auto-commit rules — every harvest produces a PR for human review. It doesn't edit your code; it only writes BUGBOT.md, LESSONS.md, and inline comments. Works with any GitHub repo in any language — but only Cursor Bugbot reads the BUGBOT.md hierarchy automatically. Other review bots (CodeRabbit, Copilot) see LESSONS.md and inline comments, and their BUGBOT.md consumers need per-bot wiring that's out of scope for the skill today.

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

*"I built an AI code reviewer. Ran it cold on 3 repos — 1,670 merged PRs across JS/Python/Scala — and published every number:*
*– author-dismissals yielded 30–52% of all rules across repos*
*– 442 of 1067 review comments landed in 1 unscoped module (intuition was wrong)*
*– 308 Copilot comments would have leaked through my own bot-filter (Copilot has no [bot] suffix)*
*– cost per one-shot setup+harvest: $0.25–$0.83, 12–77 min*
*Every finding + cost table back in the skill. → link"*

Thread format works better than the single post for this kind of "findings" content.
