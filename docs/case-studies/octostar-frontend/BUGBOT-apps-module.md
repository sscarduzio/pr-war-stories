# Bugbot Rules (Apps module)

Scope: `apps/octostar/src/components/Apps/` — the App editor, ManifestEditor, deploy timeline, secrets manager, and watchers. Heaviest review traffic in the repo (442+ comments, 200+ author dismissals in the last 8 months).

## Ref Pattern in Editor Callbacks — DO NOT Require Value in Deps

`ManifestEditorTab.runValidation`, `ManifestFormEditor.handleKvChange`/`handleMonacoFieldChange`, `DeployTimeline` all intentionally read `formDataRef.current` / `contentRef.current` / `editorRef.current` instead of closure variables. Adding the raw value (`yaml`, `formData`, `onDismiss`) to deps creates a re-validation / re-subscribe loop on every keystroke. The ref is updated at render time; the callback always sees fresh data. (PR #735, dismissed 10+ times on this pattern)

## `setEditorStatus` / React State Setters Never Need Inclusion in Deps

`setEditorStatus`, `setErrorMessages`, `setWarningMessages`, `setHasYamlSyntaxError` are React `useState` setters — guaranteed referentially stable. Flagging them as missing deps is always a false positive on this module. (PR #735, dismissed 8+ times for `setEditorStatus` alone)

## `DeveloperManifestsProvider` Is Global — No "Missing Provider" Warnings

`DeveloperManifestsProvider` wraps the entire tree at `App.tsx:72`. Any component under `apps/octostar/src/components/Apps/` is inside that provider — warnings about "hook used outside provider" for `useDeveloperManifests` are false positives. (PR #735)

## Status Config: `STATUS_MAP` Returns Singletons

`getStatusConfig()` returns the same object reference from `STATUS_MAP` for known K8s states. `useMemo` wrappers reading primitive properties are stable despite the wrapper receiving the "same" object — referential stability is preserved by design. (PR #735)

## Secrets API Requires a Running Pod

`useSecretsManager` guards `refreshSecrets` on `isDeployed`. This is intentional — the secrets endpoint 404s against errored/crashed apps. Do not remove the guard "for completeness"; it prevents error-toast spam during redeploys. (PR #731)

## CreateAppModal Name Boundaries Are Intentional

`appName.length < minLength || appName.length > maxLength` rejects strictly outside `[minLength, maxLength]`. `minLength = 2` means 2-char names are valid. Off-by-one "fixes" changing `<` to `<=` break valid short names. (PR ~#735)

## DeployPhase Type Does Not Include `'connecting'`

`DeployPhase = 'idle' | 'deploying' | 'ready' | 'failed'`. The CSS class `deploy-timeline--connecting` is a defensive leftover; there is no phase that emits it today. Don't wire new `'connecting'` cases into the state machine without adding the literal to the union. (PR #735)

## Use `asyncPool`, Not Raw `Promise.all`, Over Workspace Lists

`JobsIO.listAllWorkspaces` / anything iterating `os_workspace` entities can return thousands. Wrap with the `asyncPool(3, ...)` helper from `Workspace/dragHandlers.ts` — a raw `Promise.all` fires N concurrent server requests and can OOM the tab. (PR #425, #781)

## Async State Updates: `useAsyncCallback` or Manual Mounted-Guard

Callbacks in `hooks/useAppListState.ts` and peers must either use `useAsyncCallback` or follow the `let mounted=true; return () => mounted=false` pattern. Otherwise a stale `setState` fires after the user navigates away. (PR #735)

## Effect Cleanup Runs Synchronously — No "Stale Reset" Races

React runs a useEffect's cleanup and next setup synchronously during the commit phase, before paint. There is no intermediate render the UI can observe with partially-reset state. Dismiss bot warnings about "button may see reset values mid-transition". (PR #735)
