# Review rules — core/

Core ACL, domain model, decoders. Applies in addition to the root rules.

## Rule name is a stable audit identifier

`Rule.Name("groups_all_of")` style strings land in audit logs and users' dashboards. Do NOT derive a rule name from yaml-key shape (simplified vs extended syntax) or from decoder context — pick one canonical name and keep it across syntax variants. (PR #1080)

## Union types `A | B` belong in decoders, not at the rule boundary

A `RuleDefinition[RorKbnAuthRule | RorKbnAuthenticationRule]` leaking into `VariableUsage` typeclass resolution forces per-branch typeclass instances. Keep union-type fallback parsing inside decoders; downstream code takes a single resolved type. (PR #1163)

## Deprecation warnings must not hardcode rule-suffix

When composing "deprecated rule name" messages from a `ruleTypePrefix`, do not append `"_authorization"` or `"_authentication"` — the same decoder serves both. Parameterise the suffix. (PR #1182)

## `AuditLogSerializer` is an open SPI; don't assume sealed

Users ship custom serializers in side-loaded JARs that extend `AuditLogSerializer` directly. Detect the "default ROR schema" via `AuditIndexSchema.from(serializer)`, not pattern matching on sealed subtypes. (PR #1206)

## Decoder errors must be user-readable

Error strings produced while parsing `readonlyrest.yml` land in the user's log unmodified. "Cannot create IndexPattern from NonEmptyString" is useless; say what the user wrote wrong and how to fix it. Add a test in `AuditSettingsTests`-style when you touch a decoder. (PR #1206)
