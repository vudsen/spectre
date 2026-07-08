## ADDED Requirements

### Requirement: Assistant multi-tool rounds are suspended as one batch
The system SHALL treat all `tool_call` entries returned by a single assistant message as one pending batch whenever any tool in that round requires confirmation or human input.

#### Scenario: Confirmation appears before later tools
- **WHEN** the assistant returns multiple `tool_call` entries in one round and an earlier tool requires confirmation
- **THEN** the backend MUST preserve all tool calls from that assistant message in their original order
- **AND** the backend MUST send the full tool-call batch to the frontend instead of returning immediately after the first blocking tool

#### Scenario: Mixed blocking and non-blocking tools
- **WHEN** one assistant round contains both blocking tools and non-blocking tools
- **THEN** the backend MUST mark non-blocking tools as waiting for execution
- **AND** the backend MUST NOT execute any tool from that round until the frontend has completed the whole batch response

### Requirement: Tool-call batch events carry per-tool identity and pending status
The system SHALL expose each tool call in a pending batch with a stable `toolCallId`, original order, tool name, arguments, and a pending status that the frontend can render.

#### Scenario: Frontend receives pending batch data
- **WHEN** the backend emits a pending tool-call batch to the frontend
- **THEN** each tool entry MUST include `toolCallId`, `toolName`, `arguments`, and one of `PENDING_EXECUTION` or `PENDING_CONFIRM`
- **AND** tools with the same `toolName` in one batch MUST remain distinguishable by `toolCallId`
- **AND** the frontend MUST identify ask-human tools by `toolName = "ask_human"` instead of relying on a dedicated pending status

### Requirement: Frontend completes the whole batch before conversation recovery
The system SHALL require the frontend to collect responses for the full pending tool-call batch and submit them back in the same order as the original assistant tool calls.

#### Scenario: Multiple confirmation tools are pending together
- **WHEN** a pending batch contains multiple `PENDING_CONFIRM` tools
- **THEN** the frontend MUST allow the user to review and answer each confirmation item
- **AND** the recovery request MUST contain one structured response entry per original tool call in original order

#### Scenario: Multiple ask-human tools are pending together
- **WHEN** a pending batch contains multiple tools whose `toolName` is `ask_human`
- **THEN** the frontend MUST display only one ask-human prompt at a time in original order
- **AND** the frontend MUST still submit the completed answers together with the rest of the batch in one recovery request

### Requirement: Recovery executes and responds to every tool call in order
The system SHALL recover a pending assistant batch by reading the last unresolved assistant message from chat memory, validating the structured frontend payload against that message, and producing one tool response per original tool call in order.

#### Scenario: Recovery request matches the pending batch
- **WHEN** the frontend submits a structured response array whose `toolCallId` values exactly match the unresolved assistant message in count and order
- **AND** every response entry includes a `content` field
- **THEN** the backend MUST process each item in order
- **AND** the backend MUST execute approved confirmation tools and waiting-execution tools only during recovery
- **AND** the backend MUST treat tools whose `toolName` is `ask_human` as human-input responses during recovery
- **AND** the backend MUST build one `ToolResponseMessage` containing one response per original tool call in that same order

#### Scenario: Confirmation is rejected during recovery
- **WHEN** a `PENDING_CONFIRM` item is submitted with `content = "NO"`
- **THEN** the backend MUST NOT execute that tool
- **AND** the backend MUST generate a refusal response for that tool call so the assistant still receives a complete tool-response list

#### Scenario: Recovery payload is incomplete or out of order
- **WHEN** the frontend submits fewer responses than the original tool-call count, extra responses, a missing `content` field, or a `toolCallId` order that differs from the unresolved assistant message
- **THEN** the backend MUST reject the recovery request
- **AND** the backend MUST NOT execute any tool from that batch
