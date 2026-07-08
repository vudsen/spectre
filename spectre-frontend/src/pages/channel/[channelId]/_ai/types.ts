import type { AiToolCallDTO, AiToolCallStatus } from '@/api/impl/ai.ts'

export const ASK_HUMAN_TOOL_NAME = 'ask_human'

export type AiStreamMessageType =
  | 'USER'
  | 'TOKEN'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'ERROR'

export type PendingConfirmState = {
  toolCallId: string
  toolName: string
  parameter?: string
  content: '' | 'YES' | 'NO'
}

export type AskHumanRequest = {
  question?: string
}

export type PendingAskHumanState = AskHumanRequest & {
  toolCallId: string
  toolName: string
  parameter?: string
  content: string
}

export type PendingToolExecutionState = {
  toolCallId: string
  toolName: string
  parameter?: string
  content: ''
}

export type PendingToolState =
  | ({
      kind: 'confirm'
    } & PendingConfirmState)
  | ({
      kind: 'ask_human'
    } & PendingAskHumanState)
  | ({
      kind: 'execution'
    } & PendingToolExecutionState)

export type AiToolCallStartMessage = {
  id: string
  type: 'TOOL_CALL_START'
  data: string
  parameter?: string
  toolCallId: string
  toolStatus: AiToolCallStatus
}

export type AiToolCallEndMessage = {
  id: string
  type: 'TOOL_CALL_END'
  data: string
  parameter?: string
  toolCallId: string
}

export type AiStreamMessage = {
  id: string
  type: AiStreamMessageType
  data: string
  parameter?: string
  toolCallId?: string
  toolStatus?: AiToolCallStatus
}

export type AiCardTextSegment = {
  id: string
  kind: 'text'
  markdown: string
}

export type AiToolEventType = 'TOOL_CALL_START' | 'TOOL_CALL_END'

export type AiToolEvent = {
  id: string
  type: AiToolEventType
  data: string
  parameter?: string
  toolCallId: string
}

export type AiCardToolStatus =
  | 'waiting_execution'
  | 'pending_confirm'
  | 'pending_ask_human'
  | 'completed'

export type AiCardToolSegment = {
  id: string
  kind: 'tool'
  toolCallId: string
  toolName: string
  status: AiCardToolStatus
  parameter?: string
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

export function toPendingToolState(toolCall: AiToolCallDTO): PendingToolState {
  if (toolCall.toolName === ASK_HUMAN_TOOL_NAME) {
    return {
      kind: 'ask_human',
      toolCallId: toolCall.toolCallId,
      toolName: toolCall.toolName,
      parameter: toolCall.arguments || undefined,
      question: undefined,
      content: '',
    }
  }
  switch (toolCall.status) {
    case 'PENDING_CONFIRM':
      return {
        kind: 'confirm',
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        parameter: toolCall.arguments || undefined,
        content: '',
      }
    case 'PENDING_EXECUTION':
      return {
        kind: 'execution',
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        parameter: toolCall.arguments || undefined,
        content: '',
      }
  }
}
