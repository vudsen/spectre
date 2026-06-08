## 1. Backend websocket transport

- [x] 1.1 Add Spring websocket support in `spectre-core` and register a dedicated Arthas channel result websocket endpoint
- [x] 1.2 Define backend websocket message DTOs for `pull_results`, `pull_result`, `pull_error`, and `pull_complete`
- [x] 1.3 Wire websocket session handling so the handler can resolve the authenticated HTTP session and the existing Arthas consumer state created by `joinChannel`

## 2. Backend pull orchestration and debounce

- [x] 2.1 Extract or add a reusable pull-results workflow that can be invoked per instance without waiting for the whole channel batch
- [x] 2.2 Track in-flight pulls per websocket client, channel, and instance, and reject or skip overlapping requests for the same instance
- [x] 2.3 Emit streamed per-instance result, error, and completion events, suppressing empty result payloads while always releasing in-flight state in `finally`
- [x] 2.4 Keep existing HTTP join and execute behavior working while the frontend migrates to websocket result pulling

## 3. Frontend Arthas message bus migration

- [x] 3.1 Update `spectre-frontend/src/api/impl/arthas.ts` to define the websocket event/request contracts used by the channel page
- [x] 3.2 Refactor `spectre-frontend/src/pages/channel/[channelId]/useArthasMessageBus.tsx` to open and close the websocket connection with the channel lifecycle
- [x] 3.3 Replace timer-based HTTP `pullResults` polling with websocket `pull_results` requests that target only locally idle instances
- [x] 3.4 Reuse the existing IndexedDB persistence, context creation, input-status updates, and grouped-message aggregation when streamed `pull_result` events arrive
- [x] 3.5 Clear local per-instance busy state on `pull_complete` and surface `pull_error` failures without generating synthetic empty messages

## 4. Validation

- [x] 4.1 Add or update backend tests covering incremental per-instance delivery, empty-result suppression, and per-instance debounce
- [x] 4.2 Run `./gradlew test`
- [x] 4.3 Run `./gradlew ktlintFormat`
- [x] 4.4 Run `pnpm run check` in `spectre-frontend`
