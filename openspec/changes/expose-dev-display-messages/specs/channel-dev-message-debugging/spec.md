## ADDED Requirements

### Requirement: Development-only displayMessages helper
The system SHALL expose `window.displayMessages` only when the frontend is running with `import.meta.env.DEV` enabled.

#### Scenario: Development build exposes helper
- **WHEN** the channel page is rendered in a development environment
- **THEN** `window.displayMessages` is available as a callable function
- **AND** the helper is registered from the channel message bus runtime

#### Scenario: Non-development build hides helper
- **WHEN** the frontend is running outside a development environment
- **THEN** `window.displayMessages` MUST NOT be exposed on `window`

### Requirement: Channel resolution for displayMessages
The system SHALL support calling `displayMessages(channelId?: string)` with either an explicit channel ID or an implicit channel ID parsed from the current pathname.

#### Scenario: Explicit channel ID is used
- **WHEN** `window.displayMessages('channel-a')` is called
- **THEN** the system MUST export messages for `channel-a` regardless of the current route

#### Scenario: Missing argument falls back to pathname parsing
- **WHEN** `window.displayMessages()` is called on a page whose pathname matches `/spectre/channel/:channelId`
- **THEN** the system MUST parse `channelId` from the pathname and use it to export messages

#### Scenario: No channel ID is available
- **WHEN** `window.displayMessages()` is called without an explicit `channelId` and the current pathname does not match the channel-page pattern
- **THEN** the system MUST fail safely without exposing production behavior changes
- **AND** the system MUST warn in the console instead of throwing

### Requirement: Console export of grouped messages
The system SHALL export persisted Arthas messages to the browser console as grouped `Record<string, PureArthasResponse[]>` data, where each key is an `instanceId` and each value contains that instance's stored responses for the selected channel.

#### Scenario: Messages are grouped by instanceId
- **WHEN** a channel has persisted messages from multiple instances
- **THEN** the logged object MUST contain one entry per `instanceId` with only that instance's `PureArthasResponse` items

#### Scenario: Empty channel has no messages
- **WHEN** the selected channel has no persisted messages
- **THEN** the logged object MUST be an empty record

#### Scenario: Export progress is shown immediately
- **WHEN** `window.displayMessages(...)` is called
- **THEN** the system MUST immediately log that export is in progress before the IndexedDB query finishes
