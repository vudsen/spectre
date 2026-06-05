## Why

The current Arthas result retrieval flow relies on frontend polling and a backend HTTP endpoint that waits for every instance in a channel to finish pulling before it can return. This makes one slow instance delay the whole response, and it also sends empty result sets back to the browser even when there is nothing new to display.

## What Changes

- Replace the batch `pull-result` polling flow with a websocket-based result stream for channel pages.
- Allow the client to send `pull_results` requests on demand instead of polling on a fixed timer.
- Start backend pulling only after a websocket `pull_results` request is received, and push each instance's result to the client as soon as that instance finishes.
- Suppress websocket result messages for instances whose pull returned no Arthas payloads.
- Add server-side debounce semantics so the same websocket client cannot start overlapping `pull_results` jobs for the same channel instance.
- Scope debounce at the instance level: a later `pull_results` request may still start work for instances that are currently idle even if other instances in the same channel are already pulling.
- Update `spectre-frontend/src/pages/channel/[channelId]/useArthasMessageBus.tsx` to consume the websocket stream and persist incoming instance results through the existing IndexedDB-backed message pipeline.

## Capabilities

### New Capabilities
- `arthas-channel-result-streaming`: Stream Arthas channel pull results over websocket with per-instance incremental delivery and server-side debounce.

### Modified Capabilities

None.

## Impact

- Affected backend code in `spectre-core`, especially `io.github.vudsen.spectre.core.controller.ArthasExecutionController` and the Arthas session/result pulling flow around `ArthasExecutionService`.
- Affected frontend channel runtime in `spectre-frontend/src/pages/channel/[channelId]/useArthasMessageBus.tsx` and the Arthas API transport layer in `spectre-frontend/src/api/impl/arthas.ts`.
- Introduces a websocket protocol for channel result pulling while preserving the existing channel join and command execution behavior.
- Changes the result delivery contract from synchronous batch HTTP responses to incremental push messages, which requires coordinated backend and frontend rollout.
