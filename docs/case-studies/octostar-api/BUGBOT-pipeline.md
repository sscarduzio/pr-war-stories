# Pipeline — NiFi / Event Forwarder

Rules for `app/api/v1/pipeline/`. Root rules still apply.

## Unpause the forwarder in `finally`, not on happy path

Any code that calls `event_forwarder.pause()` must `resume()` in a `finally` block. An exception between pause and resume leaves the forwarder paused indefinitely — events accumulate silently. (PR #285)

## Write the base doc to OpenSearch before pipeline re-index

Before sending entity IDs to the NiFi re-index pipeline, ensure the base document exists in OpenSearch. Without it, chunks/embeddings have nothing to attach to and "ENRICHED RECORD" stays empty. (PR #513)

## Exclude `os_fragment` entities from processing stats

Queries against job-processing counters must add a `must_not` filter on `os_fragment`. Fragments are chunking artifacts, not user-visible entities, and skew reported totals. (PR #597)

## Use `logger.exception` inside `except`, not `logger.error(f"… {e}")`

Inside `except` blocks, call `logger.exception(msg)` — it captures the traceback automatically. Interpolating `{e}` into `logger.error` drops the stack. (PR #285; applied across pipeline routes and nifi_api_utils.)

## Fail tasks explicitly in exception handlers

`TaskProgressStore.fail(task_id)` must be called in the `except` for async jobs. Exceptions in celery/background tasks do NOT auto-mark the task failed — the UI will poll indefinitely. (PR #285)
