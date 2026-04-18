# ReadonlyREST — Claude Code / IDE Assistant Guide

**Before writing or reviewing code, read [`LESSONS.md`](LESSONS.md)** — hard-won engineering lessons from real bugs and PR reviews.

**Before proposing changes the bot will review, check the nearest [`.cursor/BUGBOT.md`](.cursor/BUGBOT.md)** — Cursor Bugbot traverses upward from each changed file and enforces these rules on every PR.

## Project shape

- Scala 3.3.3 Elasticsearch plugin. One ES version per `esNNx/` module — changing behaviour in one module usually means changing it in all peer modules.
- `core/` holds domain logic, decoders, ACL blocks. Most review activity lands here.
- `audit/` is a Java-friendly SPI; users ship custom serializers against it.
- `ror-tools/` + `ror-tools-core/` patch ES at install time.
- `integration-tests/` runs full-stack container suites on Linux and Windows.
- Build: Gradle. Default branch: `develop`.

## House style (short)

- Return `Either[DomainError, _]` for expected failures; throw for invariant violations.
- Catch `NonFatal(e)`, never `Throwable`.
- When editing an `esNNx/` file, search sibling modules for the same filename.
