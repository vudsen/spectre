## Purpose

Define how Arthas channel pages stream pull results over websocket with server-side instance debounce and incremental per-instance delivery.

## Requirements

### Requirement: Channel pages use websocket-triggered Arthas result pulling
The system SHALL provide a websocket channel-result endpoint for Arthas channel pages, and the backend MUST start pulling Arthas results only after the connected client sends a `pull_results` request.

#### Scenario: Client requests channel pull over websocket
- **WHEN** a joined channel page opens the Arthas result websocket and sends a `pull_results` message for a valid channel
- **THEN** the backend MUST begin pulling results for the requested idle instances on behalf of that websocket client
- **AND** the backend MUST NOT require the frontend to keep calling the legacy HTTP `pull-result` endpoint to receive new Arthas messages

### Requirement: Instance results are delivered incrementally
The system SHALL deliver Arthas pull results to the websocket client per instance as soon as each instance finishes, without waiting for other instances in the same channel to complete.

#### Scenario: One instance finishes before another
- **WHEN** a channel pull request targets multiple instances and one instance completes earlier than the others
- **THEN** the backend MUST immediately send that instance's Arthas payload to the websocket client
- **AND** the backend MUST continue waiting only for the remaining instances instead of delaying the completed instance's delivery

### Requirement: Empty Arthas payloads are not sent as result messages
The system SHALL suppress websocket result payload messages for pulls that return no Arthas responses.

#### Scenario: Pull returns no Arthas messages
- **WHEN** an accepted instance pull completes with an empty Arthas result list
- **THEN** the backend MUST NOT send a websocket result payload containing an empty array for that instance

### Requirement: Pull debounce is enforced per client and per instance
The system SHALL prevent one websocket client from running overlapping `pull_results` work for the same channel instance, and it MUST allow later requests to start pulls for other idle instances in the same channel using only server-side in-flight tracking.

#### Scenario: Duplicate request targets a busy instance
- **WHEN** a websocket client sends `pull_results` while a channel instance already has an in-flight pull started by the same websocket client
- **THEN** the backend MUST NOT start a second concurrent pull for that same instance
- **AND** the backend MUST keep the original in-flight pull running normally

#### Scenario: Later request re-pulls the same channel
- **WHEN** a websocket client sends another `pull_results` request for the same channel while some instances are still in flight and other instances are idle
- **THEN** the backend MUST start new pull work only for the idle instances in that channel
- **AND** the backend MUST leave the busy instances debounced until their current pulls complete

### Requirement: Frontend message bus persists streamed instance messages
The channel-page Arthas message bus SHALL consume websocket result events, persist received `PureArthasResponse` items through the existing IndexedDB pipeline, and continue updating grouped messages and input status per instance without maintaining client-side instance busy state.

#### Scenario: Streamed result is received for one instance
- **WHEN** the websocket client receives a non-empty Arthas result event for an instance
- **THEN** the frontend MUST persist the contained `PureArthasResponse` items using the existing channel message storage flow
- **AND** the frontend MUST update the aggregated channel message state and listeners as it does for persisted polling results today

#### Scenario: Frontend re-pulls without client-side idle tracking
- **WHEN** the frontend sends repeated `pull_results` requests for the same channel
- **THEN** the frontend MUST rely on backend-side debounce instead of tracking per-instance in-flight state locally
- **AND** the frontend MUST NOT create synthetic empty Arthas messages in storage or UI state
