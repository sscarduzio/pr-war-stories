# Review rules — audit/

The audit module is a Java-friendly SPI. Extend root rules.

## No Scala-only deps in this module

Users write their own serializers against this module's API; Scala-only libraries (`enumeratum`, `cats.*`) raise the bar for a Java-only consumer. Use `org.json` and plain case classes / sealed traits that compile to Java-readable bytecode. (PR #1140)

## Config-driven classes belong in `core/`, not `audit/`

`AuditFieldValueDescriptor`, `AuditFieldName`, `ConfigurableAuditLogSerializer` are ROR-internal, populated from `readonlyrest.yml` — keep them in `core/accesscontrol/audit/`. Only classes users can subclass stay here. (PR #1140, PR #1206)

## Per-serializer field-set tests are mandatory

Every concrete `AuditLogSerializer` subclass gets a unit test pinning its exact field set. Adding a field to one serializer silently won't leak into others — the test catches missed serializers. (PR #1140)
