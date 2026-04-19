# AI — Chat / RAG / Agentic

Rules for `app/api/v1/ai/`. Root rules still apply.

## Don't re-default `execution_mode` after validation

`BaseChatRequest.validate_input` already defaults `execution_mode` to `"simple"` when neither field is provided. Subsequent `request.execution_mode or "agentic"` fallbacks are dead code that contradicts the validator and silently switches modes. (PR #444)

## Keep `graphs` keyed by `ExecutionMode` enum, not `str`

`self.graphs: Dict[ExecutionMode, MultiGraph]` gives exhaustiveness over chat modes. Widening to `Dict[str, MultiGraph]` loses compile-time coverage and turns typos into runtime `KeyError`. (PR #444)

## Validate `execution_mode` before `self.graphs[...]`

`self.graphs[execution_mode]` raises a raw `KeyError` on unknown modes. `model_construct()` paths (e.g. `agentic_rag_retrieve.py`) bypass Pydantic validation, so guard with `.get(...)` and a 400 — don't rely on `Literal` alone. (PR #444)

## RAG retrieve must apply the user's workspace filter

Before any semantic-search or RAG-retrieve call, apply `search_service.add_workspaces_filter` or `search_service.proxy_search`. Skipping the filter returns documents the caller has no permission to see. (PR #433)

## Mermaid prompts must restrict to alphanumeric node IDs

In `chat_constants.py`, prompts that request mermaid diagrams must tell the model to stick to alphanumeric characters in node IDs and relationships — special chars reliably produce broken diagrams. (PR #214)

## LLM-client failures must degrade, not crash the pipeline

Agentic graphs (HyDE, agentic_intel) must catch LLM-client errors and return empty/neutral state instead of propagating — a single provider hiccup should not abort the whole request. (See commit `9dbfc9d9` "degrade gracefully on LLM failure")
