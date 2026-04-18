# Review rules — accesscontrol/factory/

Decoders and config loading. Extend root + core rules.

## Decoders return `Either`, never throw

Settings parsing failures are expected (users misconfigure `readonlyrest.yml`). Return `Either[CoreCreationError, _]`; throwing inside a Circe decoder produces the "Unsupported schema" opaque error users complain about. (PR #1206)

## Don't introduce new `AuditLogSerializer` marker traits in `audit/`

A marker trait added to `AuditLogSerializer` in the `audit/` module breaks user-supplied side-loaded serializers. Detect schema support via a `sealed AuditIndexSchema` ADT and `AuditIndexSchema.from(serializer)` on the core side. (PR #1206)

## Reuse `BaseComposedAuthenticationAndAuthorizationRule` for auth-N-and-Z composition

When adding a rule that both authenticates and authorises (LDAP, RorKbn, JWT families), compose the two via `BaseComposedAuthenticationAndAuthorizationRule` — don't reinvent the sequencing. (PR #1163)
