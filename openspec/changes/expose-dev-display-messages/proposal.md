## Why

Channel page messages are persisted in IndexedDB and grouped by instance, but there is no lightweight way to inspect the stored raw Arthas responses from the browser console during local debugging. Exposing a development-only helper on `window` makes debugging message ordering, persistence, and per-instance payloads faster without changing production behavior.

## What Changes

- Expose a `window.displayMessages` helper only when `import.meta.env.DEV` is `true`.
- Support an optional `channelId` parameter; when omitted, resolve the current `channelId` by parsing the channel page pathname such as `/spectre/channel/1256335962452000768`.
- Read persisted channel messages from the existing IndexedDB layer and group them by `instanceId`.
- Log grouped raw `PureArthasResponse[]` values to the browser console after the export finishes so local debugging can inspect the exact stored message payloads.
- Avoid exposing the helper outside development mode and remove the global binding when the channel page is unmounted or unavailable.

## Capabilities

### New Capabilities
- `channel-dev-message-debugging`: Provide a development-only browser helper for inspecting persisted Arthas channel messages grouped by instance.

### Modified Capabilities

None.

## Impact

- Affected frontend code in `spectre-frontend/src/pages/channel/[channelId]/`, with helper registration owned by `useArthasMessageBus.tsx`.
- Reuses the existing IndexedDB message storage in `db.ts`; no backend API, schema, or protocol changes are required.
- Adds a development-only `window` contract for browser-console debugging.
