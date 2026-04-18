# Review rules — ror-tools-core/

ES plugin patcher. Extend root rules.

## `performPatching()` throws; `patch()` returns `Either`

`EsPatch#performPatching()` is `Unit` and throws on technical errors — the `EsPatchExecutor.patch()` wrapper converts errors into `Either[RorToolsError, Unit]`. Don't add `try/Either` inside `performPatching`; don't let `patch()` throw. (PR #1095)

## Detect patches from older ROR versions via JAR manifest

`JarManifestModifier.findPatchedFiles` scans every patched jar for the `Patched-By-Ror-Version` manifest attribute. This is the fallback when `patch_metadata` is missing — never remove the manifest-property branch or users who patched with older ROR won't be detectable. (PR #1095)

## `backup()` as a no-op is correct only when the source file still exists in ES

`CopyTransportNetty4JarToPluginPatchCreator.backup()` intentionally does nothing because the jar is copied from ES and the original remains there. Any new `FilePatch` must restore from somewhere — if there's no source, add a real backup. (PR #1095)

## Keep `CorruptedPatchWithoutValidMetadata` distinct from `NotPatched`

When `patch_metadata` is missing but the backup folder or patched jars exist, `checkSuspectedCorruptedPatchState` reports `CorruptedPatchWithoutValidMetadata`. Do not collapse this into `NotPatched` — users get silent-success on a broken install. (PR #1095)
