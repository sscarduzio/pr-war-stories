# Review rules — integration-tests/

Windows + Linux container suites. Extend root rules.

## Per-OS ES versions are intentional

`RemoteReindexSuite` and similar pick the lowest-supported ES separately for Windows and Linux — 6.7 on Linux, a newer version on Windows (because the older Windows build is not published by Elastic). Don't "normalise" them or upgrade to match. (PR #1154)

## Truncate audit index on one node, not each node

Every node in a ROR test cluster belongs to the same cluster, so `nodes.head.truncate()` is sufficient; iterating `.foreach(_.truncate())` is a slow no-op. (PR #1186)

## Don't silence a failing integration test for a suspected production bug

If `FipsSslSuite` fails on Windows/ES<=8.18 and the cause is likely ROR itself (not test flake), disable with an explicit `// TODO(RORDEV-XXXX): production bug, out of scope` + JIRA link — never an unlabeled `.ignore`. (PR #1154)
