# Common — Shared Adapters & Services

Rules for `app/api/v1/common/` (timbr/clickhouse/s3/k8s). Root rules still apply.

## Route EXPLAIN of timbr.* to Timbr, not the DB

`timbr_query_router.py` stage 5: any `EXPLAIN` statement that references `timbr.*` must go to the Timbr HTTP API. Falling through to `DATABASE_DIRECT` (or `EXPLAIN_THEN_EXECUTE`) either misses virtual-table resolution or double-wraps in EXPLAIN. (PR #578)

## Decrement in-flight gauge at stream close, not header arrival

`http_pool_in_flight` must decrement when the httpx response stream is fully consumed/closed — not in the `finally` of `handle_async_request`. httpx does not return the connection to the pool until the body drains; early decrement under-counts and masks pool saturation. (PR #585)

## `SELECT *` from Timbr virtual tables omits physical-only columns

Physical ClickHouse columns (e.g. `os_entity_label_materialized`) are NOT exposed by Timbr's `SELECT *`. Code that diffs "existing vs new rows" after a Timbr `SELECT *` must not treat a missing column as "deleted" — query explicit columns or skip that field. (PR #450)

## `os_workspace` is absent from UNION ALL virtual tables

Timbr virtual views built on `UNION ALL` (e.g. `os_thing`, `os_workspace_relationship`) do NOT expose `os_workspace` in their projection. Querying it returns ClickHouse error 47 (UNKNOWN_IDENTIFIER). Use the `etimbr` schema or guard with `is not None`. (PR #580)

## `client.ApiException` is valid after `from kubernetes import client`

When `client` is imported as the `kubernetes.client` module, `client.ApiException` resolves to `kubernetes.client.exceptions.ApiException`. Do not flag this as "variable attribute access" — it is the canonical catch. (Bugbot dismissed ≥10× across PR #397; do not re-flag.)

## Prefer `COUNT()` / `COUNT(1)` over `COUNT(*)` in ClickHouse SQL

ClickHouse optimizes `COUNT()` and `COUNT(1)` better than `COUNT(*)` on MergeTree tables. In `sets/` handlers and adapter queries, use `COUNT()`. (PR #254)

## Escape, do not mutate, user-supplied identifiers

`escape_string` and `sanitize_concept` helpers must only SQL-escape the value — never rewrite or normalize identifiers. Mutation causes silent mismatches with existing rows. (PR #254)
