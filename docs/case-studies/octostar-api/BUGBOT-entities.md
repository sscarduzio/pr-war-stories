# Entities — CRUD & Upsert

Rules for `app/api/v1/entities/`. Root rules still apply.

## Delete permission entities LAST

When bulk-deleting, order deletions so that `os_workspace_permission` / `os_entity_permission` entities are removed after the entities they guard. Deleting permissions first makes the permission-check queries for the remaining entities fail. (PR #236)

## Always filter by `os_workspace` on large Timbr queries

Any `SELECT … FROM timbr.<concept>` over workspace-scoped tables must include `WHERE os_workspace = :os_workspace`. Unscoped queries over the whole cluster are catastrophically slow and leak cross-workspace data. (PR #152)

## Entity deletion must not block on non-deployed apps

When checking "is this entity in use?", filter by deployments that are actually running. A deleted or never-deployed app must not block entity deletion. Cross-check with `_is_app_deployed()` before treating an app link as blocking. (PR #303)

## `entity_label`, not `entity_id`, is the filesystem path key

`files_service.copy()` / filesystem traversal walks from workspace root by `entity_label` (filename). Do not "fix" callers that pass `entity_label` to path-based helpers — using `entity_id` breaks the traversal. (PR #397; Bugbot dismissed.)

## OpenSearch array fields are multi-indexed intentionally

JSON array values in upsert payloads (e.g. `["alice@x.com","bob@x.com"]`) are indexed per-element by OpenSearch — this is the searchability contract for multivalue fields. Do not flatten to a single string. (PR #493; Bugbot dismissed.)

## Enrich OTM source properties before expansion

Before calling expansion utils on a relationship result, enrich source entities with OTM properties when missing. Otherwise the expansion result silently omits fields the frontend expects. (PR #536)
