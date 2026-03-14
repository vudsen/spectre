export type AiStreamMessageType =
  | 'USER'
  | 'TOKEN'
  | 'TOOL_CALL_START'
  | 'PENDING_CONFIRM'
  | 'TOOL_CALL_END'
  | 'ASK_HUMAN'
  | 'ERROR'

export type PendingConfirmState = {
  toolName: string
  parameter?: string
}

export type AskHumanRequest = {
  question?: string
}

export type PendingAskHumanState = AskHumanRequest

export type AiStreamMessage = {
  id: string
  type: AiStreamMessageType
  data: string
  parameter?: string
  askHuman?: PendingAskHumanState
}

export type AiCardTextSegment = {
  id: string
  kind: 'text'
  markdown: string
}

export type AiToolEventType = Exclude<AiStreamMessageType, 'USER' | 'ERROR'>

export type AiToolEvent = {
  id: string
  type: AiToolEventType
  data: string
  parameter?: string
  askHuman?: PendingAskHumanState
}

export type AiCardToolStatus =
  | 'running'
  | 'pending_confirm'
  | 'ask_human'
  | 'completed'

export type AiCardToolSegment = {
  id: string
  kind: 'tool'
  toolName: string
  status: AiCardToolStatus
  events: AiToolEvent[]
}

export type AiCardSegment = AiCardTextSegment | AiCardToolSegment

export type UserConversationCard = {
  id: string
  type: 'user'
  text: string
}

export type AiConversationCard = {
  id: string
  type: 'ai'
  segments: AiCardSegment[]
}

export type ErrorConversationCard = {
  id: string
  type: 'error'
  messages: string[]
}

export type ConversationCard =
  | UserConversationCard
  | AiConversationCard
  | ErrorConversationCard
