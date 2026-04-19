# Apps — K8s App Lifecycle

Rules for `app/api/v1/apps/`. Highest author-dismissal density in the repo — read before flagging K8s patterns here.

## YAML→JSON fallback parsing is intentional

In `apps_service.py`, `except json.JSONDecodeError: pass` after `json.loads(content)` is the pattern for content that may be JSON OR YAML OR raw text. The bare `pass` lets the YAML/raw path run. Do not rewrite to log-or-raise — the fallback is the whole point. (PR #329; Bugbot dismissed repeatedly.)

## Validate app aliases as K8s labels before querying

Before calling `list_pod_for_all_namespaces` or similar with an app alias, validate with `is_valid_k8s_label_value(alias)`. Invalid labels (e.g. `_stcore`) return 400 from the K8s API and spam logs. (PR #438)

## Per-pod K8s calls in `get_enriched_status` are intentional

`_get_pod_failure_reason` / `get_transparent_status` call the CoreV1Api per deployment to surface container-level states (`CrashLoopBackOff`, `ImagePullBackOff`) that deployment-only status cannot distinguish. This N+1 shape is by design; intra-cluster calls are sub-ms. (PR #502; Bugbot dismissed.)

## `_prepare_deploy_params` and `AppLifecycle.deploy_app` split is intentional

Service layer (`_prepare_deploy_params`) sets ID, replicas, alias, workspace labels. Lifecycle layer (`AppLifecycle.deploy_app`) applies K8s-specific labels, annotations, startup_timeout, container config. Do not "consolidate" — they own different concerns by design. (PR #502; Bugbot dismissed.)

## Entity_id filter + K8s label selector is defense-in-depth

List endpoints filter by K8s label selector at the API layer AND by `entity_id` in Python. Redundant but safe against mislabeled resources. Do not remove either filter. (PR #502; Bugbot dismissed ≥5×.)

## SSE CoreV1Api is per-connection by design

Each SSE connection creates its own `CoreV1Api` instance. The instance is lightweight (wraps the shared ApiClient) and per-connection scope avoids shared mutable state for long-lived streams. Do not hoist to module-level. (PR #502; Bugbot dismissed.)

## `extra_commands = None` is correct for no-archive deployments

In `AppLifecycle.py`, when `entry_point` is `None`, `extra_commands` stays `None` — PodTemplate converts `None` to `[]` at line 181. Do NOT coerce to `[None]`; that injects a literal `null` command. (PR #502; Bugbot dismissed.)
