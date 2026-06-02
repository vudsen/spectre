## 1. IndexedDB message query support

- [x] 1.1 Add a `db.ts` query that loads persisted messages for a channel and groups `PureArthasResponse` values by `instanceId`
- [x] 1.2 Ensure the query returns an empty record when the channel has no persisted messages or no resolvable channel ID

## 2. DEV-only window helper exposure

- [x] 2.1 Define the `displayMessages(channelId?: string): void` TypeScript contract and extend the global `Window` type
- [x] 2.2 Register `window.displayMessages` from the channel-page runtime only when `import.meta.env.DEV` is `true`
- [x] 2.3 Make the helper prefer the explicit `channelId` argument and otherwise fall back to parsing `channelId` from `window.location.pathname`
- [x] 2.4 Clean up the global binding when the channel page unmounts or the fallback channel context changes

## 3. Validation

- [ ] 3.1 Verify the helper logs per-instance persisted messages from the browser console in local development
- [x] 3.2 Run `pnpm run lint` in `spectre-frontend`
- [x] 3.3 Run `pnpm run check` in `spectre-frontend`
