## Context

The channel page already has the two primitives needed for this change:

- A stable pathname shape that embeds `channelId`, for example `/spectre/channel/1256335962452000768`
- Persisted Arthas messages in IndexedDB via `spectre-frontend/src/pages/channel/[channelId]/db.ts`

`useArthasMessageBus.tsx` is responsible for creating, polling, and persisting channel messages. The requested helper is purely for browser-console debugging and must not alter production behavior.

## Goals / Non-Goals

**Goals:**

- Expose a development-only `window.displayMessages(channelId?: string)` helper that triggers a console export.
- Allow the helper to resolve the current route `channelId` from `window.location.pathname` when no argument is provided.
- Log persisted messages grouped by `instanceId` from the same IndexedDB store used by the channel page.
- Keep the helper isolated to local development and avoid impacting production bundles or runtime behavior.

**Non-Goals:**

- Changing message persistence format, bus polling behavior, or backend payloads.
- Adding any new UI for message inspection.
- Exposing the helper outside channel-page usage.

## Decisions

Expose the helper from `createArthasMessageBusInternal`, not from a page layout component or global app bootstrap.
Rationale: the helper depends on the same IndexedDB-backed channel runtime that owns message persistence, so registering it alongside bus creation keeps the debug hook close to the data source and lets cleanup happen when the bus closes.
Alternative considered: register the helper in `ChannelLayout.tsx` or `src/main.tsx`. Rejected because layout ownership is broader than the persistence runtime, and global bootstrap would widen the scope of a page-specific debugging helper.

Add a dedicated IndexedDB query helper in `db.ts` that loads all messages for a channel and groups `PureArthasResponse` values by `instanceId`.
Rationale: `db.ts` already encapsulates persistence concerns and should remain the single source of truth for querying stored channel messages.
Alternative considered: derive the return value from `useArthasMessageBus.tsx` in-memory state. Rejected because that would expose only the current hook instance state instead of the persisted records, and it would duplicate grouping logic outside the database abstraction.

Register and clean up the global function during DEV-only bus lifecycle setup and teardown.
Rationale: binding during bus creation allows the helper to share the active `db.ts` instance, capture a fallback `channelId` parsed from `window.location.pathname`, and remove itself when the bus closes.
Alternative considered: bind once and never clean up. Rejected because stale route state could leak between page transitions during local development.

Treat missing `channelId` as a guarded no-op with a console warning rather than throwing in normal usage.
Rationale: this keeps the console helper ergonomic while still making it safe to call before route state is ready.
Alternative considered: throw an error when no `channelId` is available. Rejected because it makes ad hoc debugging noisier without adding meaningful safety in development mode.

Parse the fallback `channelId` from the pathname instead of relying on React Router hooks.
Rationale: `window.displayMessages` executes outside React render and hook contexts, so it cannot call `useParams()`.
Alternative considered: read route params via hooks or component-only state. Rejected because the global function must remain callable from the browser console without violating React hook rules.

Make `window.displayMessages` synchronous from the caller's perspective and perform the IndexedDB query asynchronously in the background.
Rationale: the helper is intended for ad hoc console use, so immediately logging an "export in progress" message gives better ergonomics than requiring callers to `await` an IndexedDB-backed promise.
Alternative considered: expose a `Promise<Record<string, PureArthasResponse[]>>` return value. Rejected because it pushed IndexedDB async details onto every console user.

## Risks / Trade-offs

[Global namespace collision] -> Mitigation: only bind `window.displayMessages` in DEV mode and clean it up when the channel page unmounts.

[Helper returns stale data if messages are queried before persistence completes] -> Mitigation: document that the helper reads from IndexedDB and therefore reflects persisted state, not in-flight transient responses.

[Duplicate logic between route fallback and explicit argument handling] -> Mitigation: centralize channel resolution in the DEV registration helper inside `useArthasMessageBus.tsx`.

[Type drift between the runtime helper and the declared signature] -> Mitigation: define a shared TypeScript type for the window method and extend the global `Window` interface where the helper is registered.

[Users may expect a synchronous return value from the helper name] -> Mitigation: log an immediate "正在导出中..." progress message and emit the grouped export result via `console.log` when loading completes.
