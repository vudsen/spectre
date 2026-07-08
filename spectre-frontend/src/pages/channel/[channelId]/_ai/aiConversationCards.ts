import i18n from '@/i18n'
import { ASK_HUMAN_TOOL_NAME } from '@/pages/channel/[channelId]/_ai/types.ts'
import type {
  AiCardToolSegment,
  AiStreamMessage,
  AiToolCallStartMessage,
  AiToolEventType,
  ConversationCard,
} from '@/pages/channel/[channelId]/_ai/types.ts'

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function formatAiInlineMessage(msg: AiStreamMessage): string {
  switch (msg.type) {
    case 'TOOL_CALL_END':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_002', {
        tool: msg.data,
        parameter: msg.parameter ? ` (${msg.parameter})` : '',
      })
    default:
      return msg.data
  }
}

function toToolSegmentStatus(
  msg: AiToolCallStartMessage,
): AiCardToolSegment['status'] {
  switch (msg.toolStatus) {
    case 'PENDING_EXECUTION':
      return msg.data === ASK_HUMAN_TOOL_NAME
        ? 'pending_ask_human'
        : 'waiting_execution'
    case 'PENDING_CONFIRM':
      return 'pending_confirm'
  }
}

export function buildConversationCards(
  events: AiStreamMessage[],
): ConversationCard[] {
  const cards: ConversationCard[] = []
  let currentAiCard: Extract<ConversationCard, { type: 'ai' }> | undefined
  let currentErrorCard: Extract<ConversationCard, { type: 'error' }> | undefined
  const toolSegmentsById = new Map<string, AiCardToolSegment>()

  const ensureAiCard = (): Extract<ConversationCard, { type: 'ai' }> => {
    if (currentAiCard) {
      return currentAiCard
    }
    const card: Extract<ConversationCard, { type: 'ai' }> = {
      id: createMessageId(),
      type: 'ai',
      segments: [],
    }
    cards.push(card)
    currentAiCard = card
    return card
  }

  const appendTextSegment = (text: string): void => {
    if (!text) {
      return
    }
    const aiCard = ensureAiCard()
    const lastSegment =
      aiCard.segments.length > 0
        ? aiCard.segments[aiCard.segments.length - 1]
        : undefined
    if (lastSegment?.kind === 'text') {
      lastSegment.markdown += text
      return
    }
    aiCard.segments.push({
      id: createMessageId(),
      kind: 'text',
      markdown: text,
    })
  }

  const appendToolEvent = (event: AiStreamMessage): void => {
    if (event.type === 'TOOL_CALL_START') {
      const toolCallId = event.toolCallId || createMessageId()
      const toolSegment: AiCardToolSegment = {
        id: createMessageId(),
        kind: 'tool',
        toolCallId,
        toolName: event.data,
        status: toToolSegmentStatus(event as AiToolCallStartMessage),
        parameter: event.parameter,
        events: [],
      }
      ensureAiCard().segments.push(toolSegment)
      toolSegmentsById.set(toolCallId, toolSegment)
    }

    if (!event.toolCallId) {
      return
    }

    const toolSegment = toolSegmentsById.get(event.toolCallId)
    if (!toolSegment) {
      if (event.type === 'TOOL_CALL_END') {
        appendTextSegment(formatAiInlineMessage(event))
      }
      return
    }

    toolSegment.events.push({
      id: event.id,
      type: event.type as AiToolEventType,
      data: event.data,
      parameter: event.parameter,
      toolCallId: event.toolCallId,
    })

    if (event.type === 'TOOL_CALL_END') {
      toolSegment.status = 'completed'
    }
  }

  for (const event of events) {
    if (event.type === 'USER') {
      currentAiCard = undefined
      currentErrorCard = undefined
      toolSegmentsById.clear()
      cards.push({
        id: event.id,
        type: 'user',
        text: event.data,
      })
      continue
    }

    if (event.type === 'ERROR') {
      currentAiCard = undefined
      toolSegmentsById.clear()
      if (!currentErrorCard) {
        currentErrorCard = {
          id: createMessageId(),
          type: 'error',
          messages: [event.data],
        }
        cards.push(currentErrorCard)
      } else {
        currentErrorCard.messages.push(event.data)
      }
      continue
    }

    currentErrorCard = undefined
    if (event.type === 'TOKEN') {
      appendTextSegment(event.data)
      continue
    }

    appendToolEvent(event)
  }

  return cards
}

export function createAiMessageId(): string {
  return createMessageId()
}
