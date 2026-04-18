# Review rules — accesscontrol/blocks/

Rules that fire inside the ACL block machinery. Extend root + core rules.

## Compare `GroupId`, not `Group`

`Group` carries a human-readable name that can change without breaking identity; comparing `Group` values in rule logic can produce silent regressions after a settings edit. Use `GroupId`. (PR #1072)

## NOT_ANY_OF / NOT_ALL_OF need their own negation tests

"Current group potentially eligible" != "current group actually eligible" under negation semantics. When adding or editing `GroupsNotAllOf*` / `GroupsNotAnyOf*`, add a rule-level test that exercises the negation — not just decoder tests. (PR #1072)

