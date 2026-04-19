# Global Rules — Every PR

Cross-cutting rules that apply across the repo. Module-specific rules live in the nearest `.cursor/BUGBOT.md` up the tree — the bot traverses upward.

## ClickHouse mutations require ON CLUSTER

Every `ALTER TABLE … ADD COLUMN / UPDATE / DELETE / MODIFY COLUMN` in the ClickHouse adapter must include the `ON CLUSTER` clause (via `_get_on_cluster_clause()`). Without it, the mutation runs on one replica only and drifts silently in our clustered deployment. (PR #573)

## Uvicorn runs a single worker per pod

Do not reintroduce `--workers N` to the uvicorn command (Dockerfile, Helm, docker-compose). Each worker has its own Prometheus registry; a single scrape only hits one, so metrics from the rest are silently dropped. (PR #574)

## Secret masking value must round-trip safely

`SecretManager.MASKED_VALUE` (`"********"`, 8 chars) and `SecretMerger._is_obfuscated()` (len > 3) must agree on what a masked value looks like. Any new masked-value constant that doesn't satisfy both guards will overwrite real K8s secrets on save. (PR #494)

## Pydantic string fields reject YAML scalars

Manifest authors write `default: false` or `default: 8080` under `secrets:`. YAML parses those as `bool`/`int`, which Pydantic v2 strict mode rejects for `Optional[str]`. Coerce scalars to `str` at parse time in `Manifest.py`. (PR #608)

## Async channel UUID is session-stable

Never regenerate `async_channel` during JWT refresh, OAuth callback, or whoami. Websocket delivery keys off a stable channel ID — regenerating it silently breaks realtime events for the session. (PR #350)

## S3 object-key encoding must be idempotent

Temp-bucket helpers (`get_presigned_url_from_temp_bucket`, `get_presigned_post_to_temp_bucket`) are called from paths that may have already percent-encoded the key. Always `unquote` then `quote` — never re-encode blindly. Signature mismatches on special chars (emoji, spaces) produce silent 403s. (PRs #388, #393)

## Only human review comments feed the harvester

The `harvest-lessons.yml` bot filter must exclude `cursor`, `cursor[bot]`, `Copilot` (GitHub Copilot Code Review posts as plain `Copilot` with NO `[bot]` suffix), and `coderabbitai`. Missing any of these floods `LESSONS.md` with bot critiques. (Filter in `.github/workflows/harvest-lessons.yml`)
