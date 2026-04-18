# Review rules — root

These rules apply to all diffs. Module-scoped rules add to (do not override) these.

## Sync ES-version modules together

When editing a file under one `esNNx/` module, search for the same filename in sibling `es*x/` modules and apply equivalent changes. Drift between ES-version modules is the #1 regression source. (PR #407)

## Either for expected failures, exceptions for technical errors

Return `Either[DomainError, _]` for anticipated failures (bad config, rule mismatch). Throw for unrecoverable technical issues (IO on files that must exist, invariant violations). Do not "normalise" throwing code to Either for truly unexpected cases. (PR #1095)

## Catch `NonFatal`, never `Throwable`

`catch Throwable` swallows `OutOfMemoryError` and JVM signals. Use `case NonFatal(e)` (or `Exception`) — always. (PR #1185)

## Scala 3.3.3 everywhere except the audit example

Tests and main code are Scala 3; use Scala-3-compatible imports (e.g. `org.scalatest.matchers.should.Matchers` import form). Don't copy Scala-2 patterns. Exception: `custom-audit-examples/` serializers. (PR #1163)

## `Response` in ES REST client is NOT AutoCloseable

Do not wrap ES client `Response` in try-with-resources or add `.close()` calls. Only `RestClient` itself closes. A "fix leak" here breaks compilation or silently no-ops. (PR #1101)

## `ChannelInterceptingRestHandlerDecorator` fallback path is last-resort

Every `esNNx/src/main/scala/tech/beshu/ror/es/utils/ChannelInterceptingRestHandlerDecorator.scala` has a failure branch that runs only on programmatic errors in ROR itself. Do not add user-facing reply bodies, Authorization-header sanitisation, or ThreadRepo state cleanup there — it masks real bugs. Clear ThreadRepo in `RorRestChannel#sendResponse`, not here. (PR #1176)

## `ThreadRepo` thread-local must be cleared on every ES module

ThreadRepo sets a channel in one place and MUST clear it in `RorRestChannel#sendResponse` on every `esNNx/` module. When adding a new ES version module, copy the clear-path; a missing clear in one module is a cross-request leak. (PR #1176)
