---
name: pr-war-stories
version: 0.7.0
updated: 2026-04-17
description: Activate when the user wants to teach their AI code reviewer from PR history, set up Cursor Bugbot rules (.cursor/BUGBOT.md), harvest review comments into review rules, or audit existing rules. Commands — /pr-war-stories setup | harvest | audit | add-module | recheck.
allowed-tools: Read,Write,Edit,Glob,Grep,Bash
---

# PR War Stories

A self-improving AI code review pipeline. Distills institutional knowledge out of PR history, places it where review bots and IDE assistants can actually use it, and closes the loop with a GitHub Action that surfaces new lessons on every merged PR.

## How to run a command

When the user invokes `/pr-war-stories <command>`, Read the command file AND its listed reference files **before doing anything else**. SKILL.md contains concepts, not procedures — do not execute from SKILL.md alone.

| Command | Read these files, in order |
|---|---|
| `setup` | `commands/setup.md`, `reference/classification.md`, `reference/quality-bar.md` |
| `harvest` | `commands/harvest.md`, `reference/classification.md`, `reference/quality-bar.md` |
| `audit` | `commands/audit.md`, `reference/classification.md`, `reference/graduation.md` |
| `rebalance` | `commands/rebalance.md`, `commands/add-module.md` |
| `add-module <path>` | `commands/add-module.md`, `reference/quality-bar.md` |
| `recheck` | `commands/recheck.md` |

When a command file tells you to "run `/pr-war-stories <other>`" as a sub-step, Read that command's file and execute it inline — do not treat the slash-command as documentation.

## Commands

| Command | Purpose | When |
|---|---|---|
| `/pr-war-stories setup` | Bootstrap the full system | Once per repo |
| `/pr-war-stories harvest` | Turn new review comments into rules | After every merged PR with review activity |
| `/pr-war-stories audit` | Measure effectiveness, prune & reclassify | Quarterly |
| `/pr-war-stories rebalance` | Promote hot modules, demote cold scopes | After audit flags hierarchy mismatch |
| `/pr-war-stories add-module <path>` | Add rules for a new complex module | On demand |
| `/pr-war-stories recheck` | Verify rules still reference existing code | After setup, harvest, big refactors |

## Terminology

Used consistently across every command and reference file:

- **the bot** — the AI PR reviewer (e.g., Cursor Bugbot, CodeRabbit, Copilot). Reads `.cursor/BUGBOT.md` at review time.
- **the IDE assistant** — the AI that helps developers write code (e.g., Claude Code, Cursor). Reads `LESSONS.md` at write time.
- **the developer** — a human making a PR.
- **the skill** — `pr-war-stories` itself, running inside Claude Code.

## Core concept: three memory layers

Not all knowledge belongs in the same place. Rules go where the right reader will actually see them.

| Layer | File | Reader | Purpose |
|---|---|---|---|
| 1 | `.cursor/BUGBOT.md` (hierarchical) | the bot, at review time | Enforceable rules checked against diffs. The bot traverses upward from each changed file, collecting every `BUGBOT.md` it finds. |
| 2 | `LESSONS.md` | the IDE assistant, at write time | Educational engineering lessons that aren't diff-checkable but inform how code gets written. |
| 3 | Inline source comments | the bot + humans, when that file is in the diff | Rules that apply to exactly one file or function. Placed in the code itself. |

A rule lives in **exactly one** layer. Duplication across layers is noise — the same developer sees the same rule twice. See [`reference/classification.md`](reference/classification.md) for the taxonomy that decides where each rule goes.

## Core concept: the feedback loop

```
PR merged → workflow fires → harvest summary posted on PR → /pr-war-stories harvest → rules committed → bot enforces on next PR
```

Workflow template: [`templates/harvest-lessons.yml`](templates/harvest-lessons.yml). Installed by setup. Customised per repo via the `scopeRules` array.

## Token-budget discipline

Fewer rules = more attention per rule.

- **BUGBOT.md**: ≤400 words per file ideal, ≤600 acceptable, >800 audit.
- **Worst case** (deepest-nested PR, 3 files combined): <2000 tokens.

Full quality criteria per layer: [`reference/quality-bar.md`](reference/quality-bar.md).

## What this skill does not do

- Does not monitor production incidents or integrate with Sentry / on-call systems.
- Does not auto-commit rules — every harvest produces a PR for human review.
- Does not edit existing code — it writes `BUGBOT.md`, `LESSONS.md`, and inline comments, never refactors the code the comments sit on.
- Does not backfill older PRs beyond the explicit `--limit` passed to `gh pr list` (re-run with a larger limit to go deeper).
- Does not work on private repos without `gh auth`.
- Does not deduplicate across repos — a monorepo split requires running `recheck` in each resulting repo.

## Supported AI reviewers

The three-layer architecture is reviewer-agnostic in principle, but only Layer 1 wiring is opinionated:

- **Cursor Bugbot** — first-class. Reads `.cursor/BUGBOT.md` hierarchy automatically. No extra wiring.
- **CodeRabbit, Copilot Code Review, other bots** — the BUGBOT.md files exist in the repo but those bots won't find them unless you configure their "read this file" setting manually. The skill writes the rules; wiring the reader is out of scope today.
- **Claude Code & Cursor (IDE assistants)** — wired by Setup Step 7 via `CLAUDE.md` / `AGENTS.md` pointers to `LESSONS.md`.
- **Any reviewer that reads source files** — Layer 3 inline comments Just Work; no wiring needed.

## Reference material

- [`reference/classification.md`](reference/classification.md) — REVIEWABLE / EDUCATIONAL / SINGLE-FILE / OVERLAPPING / STALE taxonomy.
- [`reference/quality-bar.md`](reference/quality-bar.md) — format + quality criteria per layer + token budget details.
- [`reference/anti-patterns.md`](reference/anti-patterns.md) — canonical list of what NOT to do.
- [`reference/graduation.md`](reference/graduation.md) — when to retire a BUGBOT.md rule into lint/test/CI.

## Cross-cutting notes

**Cross-module rules** — belong in root `.cursor/BUGBOT.md`. Don't duplicate into module files; the bot traverses upward.

**Module renamed/moved** — move the `.cursor/BUGBOT.md` with it (git tracks the rename), then run `/pr-war-stories recheck` in the same refactor PR.

**Rule promotion/demotion** — promote upward when the same bug recurs in a different module; demote downward when a root rule only ever fires on one module's files.

**Merge strategy** — works with squash, merge commit, or rebase. The skill queries PR metadata, not commit history.
