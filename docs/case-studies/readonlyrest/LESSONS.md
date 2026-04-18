# LESSONS.md

Hard-won engineering lessons from real ReadonlyREST PRs. The IDE assistant reads this before writing code.

## Security

### Never fall back to `X-Forwarded-For` for the remote address when the TCP address is missing

A missing TCP remote address is a bug in how you extract it, not an invitation to use a client-supplied header. `X-Forwarded-For` is trivially spoofable; using it to populate "hosts" rules lets any caller bypass IP-based ACLs by sending the header themselves.

```scala
// WRONG
val remote = req.remoteAddress.getOrElse(req.header("X-Forwarded-For").orNull)

// RIGHT
val remote = req.remoteAddress
  .getOrElse(throw new IllegalStateException(
    "No remote address on request — investigate TCP-layer extraction"
  ))
```

(PR #407)

## Error handling

### Use `Either[DomainError, _]` for expected failures, throw only for unrecoverable technical errors

"Anything that can go wrong" is not a uniform category. Config errors, missing file, wrong rule shape, authentication miss — these are expected domain failures, callers handle them. IO errors on files that MUST exist, JVM-level invariant violations, programming mistakes — throw. Collapsing the two costs debugging clarity and stack traces.

```scala
// WRONG: everything is Either, even impossible cases
def performPatching(): Either[RorToolsError, Unit] =
  Try(Files.copy(src, dst)).toEither.left.map(e => RorToolsError.Unknown(e.getMessage))

// RIGHT: expected failures as Either at the boundary; invariants throw
def patch(): Either[RorToolsError, Unit] =
  checkWithPatchedByFileAndEsPatch() match {
    case NotPatched              => doPatch()             // doPatch() throws on IO, that's OK
    case PatchedWithCurrentRorVersion(v) => Left(EsAlreadyPatchedError(v))
    case PatchProblemDetected(p) => Left(p.rorToolsError)
  }
```

(PR #1095)

## Data model

### Group identity is `GroupId`, not `Group`

`Group` carries a display name that may be edited. Comparing `Group` values inside ACL logic means a settings edit to rename a group silently changes authorization results. Only `GroupId` is a stable identity.

```scala
// WRONG
permittedGroups.contains(userGroup)       // Group.equals compares name too

// RIGHT
permittedGroups.map(_.id).contains(userGroup.id)
```

(PR #1072)

## Scala style

### Use `NonFatal(e)`, never `catch Throwable`

`Throwable` catches `OutOfMemoryError`, `StackOverflowError`, and JVM-level signals you cannot recover from. At best you hide a real crash; at worst you turn a VM-fatal error into a silent retry loop.

```scala
// WRONG
try doWork()
catch { case t: Throwable => logger.warn("work failed", t); fallback() }

// RIGHT
import scala.util.control.NonFatal
try doWork()
catch { case NonFatal(e) => logger.warn("work failed", e); fallback() }
```

(PR #1185)

## Backward compatibility

### When a metadata-file format needs to change, add a second file — don't break the first

The old `patched_by` file held a single ROR version string and shipped in many past patcher releases. Adding hashes + paths into the same file would break rollbacks from new → old ROR. Keep the old file writeable with its old single-line format; put new data in a new `patch_metadata` file. New ROR reads both; old ROR reads just the old.

```scala
// WRONG: overwrite the legacy file with a new schema
rorPluginDirectory.writePatchedByFile(
  s"$rorVersion\n" + fileHashes.map(_.toLine).mkString("\n")
)

// RIGHT: two files, both kept in sync
rorPluginDirectory.writePatchedByFile(rorVersion)            // old readers still work
rorPluginDirectory.updateEsPatchMetadata(fileHashes)         // new file, new schema
```

(PR #1095)

## Configuration

### Idempotent resource creation is not optional

Audit data streams, ILM policies, index templates — creation must succeed when the resource already exists. ROR runs `install-ror-es-using-file.sh` on every container start; a non-idempotent creator breaks restarts.

```scala
// WRONG
def createDataStream(name: String): Task[Unit] =
  esClient.createDataStream(name)   // fails if it already exists

// RIGHT
def ensureDataStream(name: String): Task[Unit] =
  esClient.dataStreamExists(name).flatMap {
    case true  => Task.unit
    case false => esClient.createDataStream(name)
  }
```

(PR #1076)

## Audit schema

### Audit rule names are stable identifiers — don't let syntax drift rename them

Rules produce audit events containing the rule name as a string. Users grep those logs. If today's `GroupsAllOfRule` reports `"groups_all_of"` under the simplified syntax and `"groups.all_of"` under the extended syntax, users' alerts break. Pick one canonical name per rule and fix it, regardless of how the user declared it in yaml.

```scala
// WRONG
object GroupsAllOfRule {
  def name(syntax: Syntax): Rule.Name = syntax match {
    case Syntax.Simple   => Rule.Name("groups_all_of")
    case Syntax.Extended => Rule.Name("groups.all_of")
  }
}

// RIGHT
object GroupsAllOfRule {
  val name: Rule.Name = Rule.Name("groups_all_of")
}
```

(PR #1080)
