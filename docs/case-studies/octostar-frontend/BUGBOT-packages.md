# Bugbot Rules (Shared Packages)

Scope: `packages/` (octostar-platform-api, octostar-platform-react, octostar-platform-types, ui, eslint-config, typescript-config, vitest-config).

## Every Export Is a Two-App Contract

Both `apps/octostar` and `apps/search-app` consume these packages. A renamed export, changed signature, or removed prop is a coordinated multi-app change — update both apps in the same PR or introduce an overload first. (PR #508)

## `ontologyAPI.getEntity` Contract Has Historical Foot-Guns

`getEntity({entity_type, entity_id})` has been the source of repeated bugs when callers forget that the lookup semantics differ from raw SQL. Before wrapping or re-exporting it, read existing callsites in `FusionApi.ts`. (PR #346)

## Log Before Silently Coercing Unexpected Input

In platform utilities (Map component, markdownUtils, API adapters) do not silently normalize an unexpected type to a default — log a warning with the received value. Silent coercion hides upstream bugs. (PR #517)

## Consider `entity_type` Optional Where `entity_id` Is Globally Unique

Platform helpers that require `{entity_type, entity_id}` force callers to plumb a redundant value. If `entity_id` uniquely identifies the entity, make `entity_type` optional with a single lookup. (PR #508)
