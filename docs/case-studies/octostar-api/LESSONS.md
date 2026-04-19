# Engineering Lessons Learned

Hard-won lessons from real bugs, PR reviews, and production incidents. **Read this before reviewing or writing code.**

Rules the bot can check on a diff live in `.cursor/BUGBOT.md` (not here). This file is for lessons that inform how you write code but can't be enforced by a reviewer bot.

## Database & ORM

### ClickHouse ReplicatedMergeTree caches INSERT hashes in ZooKeeper

After a hard delete, a subsequent INSERT with the same row hash is deduplicated and silently dropped. You'll see "import succeeded" but rows are missing. Workaround: append a garbage/unique marker column to change the hash.

```python
# WRONG — workspace re-import after delete drops rows silently
await ch.execute(f"DELETE FROM {table} WHERE os_workspace = %s", (ws,))
await ch.execute(f"INSERT INTO {table} VALUES …")  # dedup cache hits — no-op

# RIGHT — force a new hash
import uuid
await ch.execute(
    f"INSERT INTO {table} (…, _import_marker) VALUES (…, %s)",
    (*values, str(uuid.uuid4())),
)
```

(PR #361)

### ClickHouse error 47 (UNKNOWN_IDENTIFIER) on `os_workspace` is a view-projection issue

Timbr virtual tables built on `UNION ALL` (e.g. `os_thing`, `os_workspace_relationship`) do not expose `os_workspace` in their projection even though the underlying tables have it. Use `etimbr` (enriched Timbr) or guard the reference.

```python
# WRONG
sql = f"SELECT os_entity_uid, os_workspace FROM timbr.{entity_type}"

# RIGHT — go through etimbr for enriched projection
sql = f"SELECT os_entity_uid, os_workspace FROM etimbr.{entity_type}"
```

(PR #580)

## External Services & APIs

### httpx returns connections to the pool on stream close, not on headers

If you increment an in-flight gauge on send and decrement in the `finally` of `handle_async_request`, you'll systematically under-count — httpx keeps the connection out of the pool until the response body is consumed.

```python
# WRONG — decrements before the body is read
try:
    gauge.inc()
    response = await pool.handle_async_request(req)
    return response
finally:
    gauge.dec()

# RIGHT — hook the stream close event
gauge.inc()
response = await pool.handle_async_request(req)
response.stream._close_callbacks.append(lambda: gauge.dec())
return response
```

(PR #585)

### S3 presigned URLs are signature-sensitive to encoding

Both the PUT (upload) signer and the GET (download) signer must encode the key the same way. Files with emoji/unicode produce 403 on download if one side re-encodes an already-encoded key.

```python
# WRONG — double-encodes keys that were already %-encoded upstream
encoded = quote(key)

# RIGHT — decode first so quote is idempotent
encoded = quote(unquote(key))
```

(PRs #388, #393)

## Data Model & Serialization

### Pydantic v2 strict mode rejects YAML-parsed scalars for string fields

Manifest authors write `default: false` or `default: 8080` under `secrets:` without quotes. `yaml.safe_load` returns `bool` / `int`; Pydantic v2 strict string rejects it. Coerce at the boundary.

```python
# WRONG — fails on `default: false` in YAML
class SecretDef(BaseModel):
    default: Optional[str] = None

# RIGHT — pre-coerce scalars to str
class SecretDef(BaseModel):
    default: Optional[str] = None

    @field_validator("default", mode="before")
    @classmethod
    def _coerce_scalar_to_str(cls, v):
        if isinstance(v, (bool, int, float)):
            return str(v).lower() if isinstance(v, bool) else str(v)
        return v
```

(PR #608)

### `Dict[Literal[...], T]` gives exhaustiveness; `Dict[str, T]` loses it

Narrow dict keys to a `Literal` or enum when values are mode-keyed — the type checker then proves all modes are present. Widening to `str` turns typos into runtime `KeyError`.

```python
# WRONG — nothing enforces all modes exist
self.graphs: Dict[str, MultiGraph] = {...}

# RIGHT — exhaustiveness at init time
class ExecutionMode(str, Enum):
    SIMPLE = "simple"
    AGENTIC = "agentic"
    AGENTIC_INTEL = "agentic_intel"

self.graphs: Dict[ExecutionMode, MultiGraph] = {...}
```

(PR #444)

## Deployment & Infrastructure

### One uvicorn worker per pod — scale with replicas, not `--workers`

Each worker process has its own Prometheus registry. A single Prometheus scrape hits one worker; metrics from the rest vanish. Use `replicas: N` in Helm instead.

```dockerfile
# WRONG
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--workers", "4"]

# RIGHT — single worker per pod; scale via Kubernetes replicas
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

(PR #574)

### K8s secret round-trip: masked value must pass both guards

The frontend receives the masked value back and POSTs it unchanged on save. Backend has two guards: `SecretManager.MASKED_VALUE` (equality) and `SecretMerger._is_obfuscated` (length). If they disagree, real secrets get overwritten with the mask literal.

```python
# WRONG — 3 asterisks fails `len > 3`, so "***" is saved as the real secret
MASKED_VALUE = "***"

def _is_obfuscated(v: str) -> bool:
    return len(v) > 3  # "***" is not obfuscated by this check!

# RIGHT — single source of truth, long enough to pass length guard
MASKED_VALUE = "********"  # 8 chars

def _is_obfuscated(v: str) -> bool:
    return v == MASKED_VALUE or (len(v) >= 8 and set(v) == {"*"})
```

(PR #494)

## AI / LLM

### LLM calls must degrade gracefully, never abort the pipeline

A single provider blip (rate-limit, 500, timeout) must not kill an agentic graph. Catch at the client call site and return a neutral state so downstream nodes can continue or the graph can reach a terminal error node.

```python
# WRONG — propagates provider errors to the user
hyde_doc = await llm.complete(hyde_prompt)

# RIGHT — degrade to the original query
try:
    hyde_doc = await llm.complete(hyde_prompt)
except LLMError as e:
    logger.warning("HyDE generation failed, degrading to raw query: %s", e)
    hyde_doc = None  # downstream uses the original query
```

(Commit `9dbfc9d9`: "degrade gracefully on LLM failure")

## Configuration

### `async_channel` is a session-stable UUID — do not regenerate on refresh

Websocket delivery keys off this ID. OAuth callback and whoami must read the existing cookie and preserve it when minting a new JWT. Regenerating it mid-session silently disconnects realtime events for every connected client on that session.

```python
# WRONG — whoami mints a fresh UUID every call
async_channel = str(uuid.uuid4())

# RIGHT — reuse from os_jwt / async-token cookies
async_channel = (
    existing_claims.get("async_channel")
    or cookies.get("async-token-async_channel")
    or str(uuid.uuid4())
)
```

(PR #350)
