# Files — S3 / Attachments / Tree

Rules for `app/api/v1/files/`. Root rules still apply (including the S3 idempotent-encoding rule).

## Preview URLs default to `home.` not `api.`

File-upload and workspace-import URLs must use the `home.` subdomain by default (with Helm override). The `api.` subdomain is for API routes; using it for uploads breaks the ingress path and fails large-file imports. (PR #504)

## Pass `x-ontology` through — don't hardcode `os_ontology_v1`

`files_service` must read the ontology from the request headers (`x-ontology`) and pass it down. Hardcoding `os_ontology_v1` breaks tenants on other ontology versions and silently returns cross-ontology results. (PR #117)

## Copy requires recursive entity + S3 work, not just a row insert

`files_service.copy()` must replicate S3 objects AND clone child entities with consistent `os_parent_folder` rewrites. Copying only the parent row produces orphaned children and broken folder trees. (PR #117)

## Nginx upload limit is 10GB — don't reduce below this

Workspace imports legitimately reach 10GB. Any Helm / ingress change that reduces `client_max_body_size` will surface as a silent 502 on large imports. (PR #298)
