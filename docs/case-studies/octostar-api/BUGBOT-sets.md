# Sets — Expansion Handlers

Rules for `app/api/v1/sets/`. Root rules still apply.

## `hasattr(result, "message")` does NOT mean "no error"

In handler code, branching on `not hasattr(result, "message")` suppresses real errors. Check the result's `.status` / exception explicitly — don't infer success from duck-typed attribute presence. (PR #254)

## Count queries wrap the expansion SQL, not re-implement it

If a handler has an expansion SQL builder, the count variant must be `SELECT COUNT() FROM ({sql}) q` — not a parallel query that can drift. Duplicated logic produces inconsistent page counts vs. page content. (PR #254)

## Reject unsupported pagination params explicitly

`offset` / `limit` / sort params must be either fully supported OR raise 400 if passed. Silently ignoring them gives callers a false impression the pagination worked. (PR #254)

## `os_parent_folder` is only valid for `os_wsfs_object` descendants

Handlers that expand by `os_parent_folder` must first check the concept inherits from `os_wsfs_object`. Non-filesystem concepts (e.g. `actor`) have no `os_parent_folder` and the filter silently returns empty. (PR #254)
