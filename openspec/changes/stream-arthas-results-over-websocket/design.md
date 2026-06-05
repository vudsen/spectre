## Context

`ArthasExecutionController#pullResults` currently serves channel-page result retrieval through a synchronous HTTP GET endpoint. For batch channels, the controller fans out work across instances but still blocks on a `CountDownLatch` until every instance completes, so one slow instance delays the full response. The frontend hook `spectre-frontend/src/pages/channel/[channelId]/useArthasMessageBus.tsx` then polls this endpoint repeatedly and persists every returned message list into IndexedDB, even when the list for an instance is empty.

The requested change is cross-cutting:

- backend transport changes from HTTP polling to websocket streaming
- per-client concurrency control must move to the server and be scoped to channel instance IDs
- frontend message persistence must keep working with incremental delivery instead of batch HTTP responses

The current backend uses servlet session state to store `instanceId -> consumerId`, so the websocket design must preserve the authenticated HTTP session and reuse the same join/consumer lifecycle.

## Goals / Non-Goals

**Goals:**

- Add a websocket channel result transport that starts pulling only when the client explicitly requests `pull_results`.
- Stream each instance's Arthas payload to the browser immediately after that instance finishes pulling instead of waiting for the whole channel.
- Avoid sending empty Arthas result payloads to the browser.
- Enforce server-side debounce per websocket client and per channel instance so overlapping pulls for the same instance are rejected or skipped, while idle instances can still be pulled.
- Update `useArthasMessageBus.tsx` to drive on-demand pulls over websocket and feed received instance messages into the existing IndexedDB and Redux aggregation flow.

**Non-Goals:**

- Replacing the existing HTTP `join`, `execute`, `interrupt`, or profiler file flows with websocket transport.
- Redesigning Arthas message formats returned by `ArthasExecutionService.pullResults`.
- Changing channel membership, database schema, or IndexedDB storage schema.
- Solving cross-browser offline buffering or resumable websocket replay.

## Decisions

Use a dedicated websocket endpoint for channel result streaming, backed by Spring's low-level websocket handler API rather than STOMP.
Rationale: the protocol only needs a small request/response event set for one page-level workflow, so a raw websocket handler keeps the dependency and framing overhead low. It also fits the existing session-based controller logic better than introducing a broker abstraction.
Alternative considered: keep HTTP and switch to SSE. Rejected because the client must actively send `pull_results` commands over the same long-lived connection. Alternative considered: use STOMP/SockJS. Rejected because there is no existing messaging broker infrastructure in the project and the required interaction model is simple request-driven streaming.

Reuse the existing servlet session for websocket authentication and consumer resolution.
Rationale: `joinChannel` already stores `ArthasConsumerDTO` objects in the HTTP session under `InstanceIdToConsumerId:*`, and the websocket handler can read the same session attributes after handshake. This keeps join semantics unchanged and avoids inventing a second consumer registry.
Alternative considered: create a websocket-only consumer map detached from the HTTP session. Rejected because it duplicates lifecycle state and makes reconnect behavior harder to reason about.

Define an explicit lightweight websocket protocol with control events separate from Arthas payload events.
Rationale: suppressing empty Arthas result arrays means the client still needs a way to know when a requested instance pull has finished so it can mark that instance idle and issue later pulls. A separate completion event preserves that signal without sending empty payload arrays.
Alternative considered: send nothing at all when a pull finishes with no results. Rejected because the frontend would have no deterministic way to release its per-instance busy state. Alternative considered: send empty `pull_result` arrays. Rejected because it preserves the current network waste in a different transport.

Proposed protocol:

- Client -> Server `pull_results`
  - fields: `type`, `requestId`, optional `instanceIds`
  - semantics: request pulls for the given channel's idle instances; when `instanceIds` is omitted, the server treats it as "all instances in the joined channel"
- Server -> Client `pull_result`
  - fields: `type`, `requestId`, `instanceId`, `messages`
  - emitted only when `messages` is non-empty
- Server -> Client `pull_error`
  - fields: `type`, `requestId`, `instanceId`, `message`
  - emitted when pulling one instance fails
- Server -> Client `pull_complete`
  - fields: `type`, `requestId`, `instanceId`, `deliveredCount`
  - always emitted for each accepted instance request, including zero-result completions

Track in-flight pulls by websocket client session, channel ID, and instance ID.
Rationale: the debounce rule is specifically "one client must not overlap pulls for the same channel instance", not a global lock across all users. Maintaining an in-memory `inFlight` set keyed by websocket session and instance ID matches that requirement and allows later `pull_results` messages to schedule only the idle subset.
Alternative considered: debounce at the whole channel level. Rejected because it would continue to let one slow instance block other idle instances from being pulled. Alternative considered: debounce globally per instance across all clients. Rejected because it would couple unrelated user sessions and change multi-user behavior.

Keep frontend scheduling instance-aware and optimistic, with server-side filtering as the source of truth.
Rationale: `useArthasMessageBus.tsx` already owns the polling loop and message persistence pipeline. It can evolve into a websocket runtime that tracks which instances are currently requested, sends `pull_results` only for locally idle instances, and clears busy state when `pull_complete` arrives. The server still filters duplicate or stale requests, so correctness does not depend on perfect client timing.
Alternative considered: make the frontend fire blind `pull_results` requests for the full channel on every tick. Rejected because it creates unnecessary websocket control traffic and hides instance-level readiness information that the UI runtime can already use.

Preserve the existing IndexedDB persistence and Redux aggregation path by normalizing streamed events back into per-instance `PureArthasResponse[]`.
Rationale: the current bus already knows how to append `PureArthasResponse` items, update input status, create command contexts, and notify listeners. Reusing that logic reduces migration risk and keeps the UI changes focused on transport and scheduling.
Alternative considered: bypass IndexedDB and render streamed results directly in memory. Rejected because it would fork message handling behavior from the current page model.

## Risks / Trade-offs

[Websocket session handling may diverge from controller request handling] -> Mitigation: use Spring session-aware handshake integration and explicitly validate that the websocket handler can resolve the same session attributes populated by `joinChannel`.

[In-flight instance bookkeeping may leak when the socket closes or a task crashes] -> Mitigation: clear all tracked instance locks on websocket disconnect and release each instance in a `finally` block around pull execution.

[A completion event adds some control traffic even when result payloads are empty] -> Mitigation: keep `pull_complete` minimal and avoid sending empty `messages` arrays, which are the larger waste source today.

[Frontend and backend can drift on protocol event names or shapes] -> Mitigation: define a single TypeScript message union in `arthas.ts` and mirror the same fields in backend DTOs/tests.

[Introducing websocket support adds a new Spring dependency and runtime path] -> Mitigation: use a narrow endpoint only for Arthas channel pulls, add focused backend tests for the handler, and keep existing HTTP execute/join endpoints unchanged for rollback safety.

## Migration Plan

1. Add websocket backend support and the new channel result handler while leaving the existing HTTP `pull-result` endpoint in place temporarily.
2. Update the frontend Arthas message bus to connect to the websocket endpoint after channel join, request pulls on demand, and persist streamed per-instance payloads through the existing DB pipeline.
3. Verify that batch channels continue to receive `execute` responses over HTTP while result retrieval shifts to websocket events.
4. After the frontend is migrated and validated, stop using the HTTP polling endpoint from the channel page; remove it in a follow-up cleanup change if no other callers remain.

## Open Questions

- Should the backend expose the websocket endpoint under `/arthas/channel/{channelId}/results-ws` or another path that better matches the project's existing routing conventions?
- Do we want a lightweight `pull_accepted` or `pull_skipped` acknowledgement for observability, or is `pull_complete` sufficient once the frontend targets only idle instances?
