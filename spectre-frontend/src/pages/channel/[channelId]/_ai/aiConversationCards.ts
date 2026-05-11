import i18n from '@/i18n'
import type {
  AiCardToolSegment,
  AiStreamMessage,
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
    case 'TOOL_CALL_START':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_001', {
        tool: msg.data,
        parameter: msg.parameter ? ` (${msg.parameter})` : '',
      })
    case 'TOOL_CALL_END':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_002', {
        tool: msg.data,
        parameter: msg.parameter ? ` (${msg.parameter})` : '',
      })
    case 'PENDING_CONFIRM':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_003', {
        tool: msg.data,
      })
    case 'ASK_HUMAN':
      return msg.askHuman?.question || msg.data
    default:
      return msg.data
  }
}

export function buildConversationCards(
  events: AiStreamMessage[],
): ConversationCard[] {
  const cards: ConversationCard[] = []
  let currentAiCard: Extract<ConversationCard, { type: 'ai' }> | undefined
  let currentErrorCard: Extract<ConversationCard, { type: 'error' }> | undefined
  let activeToolSegment: AiCardToolSegment | undefined

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
    const lastSegment = aiCard.segments.at(-1)
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
    if (!activeToolSegment) {
      if (event.type === 'TOOL_CALL_END') {
        appendTextSegment(formatAiInlineMessage(event))
        return
      }
      if (event.type === 'TOOL_CALL_START') {
        const toolSegment: AiCardToolSegment = {
          id: createMessageId(),
          kind: 'tool',
          toolName: event.data,
          status: 'running',
          events: [],
        }
        ensureAiCard().segments.push(toolSegment)
        activeToolSegment = toolSegment
      } else {
        const toolSegment: AiCardToolSegment = {
          id: createMessageId(),
          kind: 'tool',
          toolName: event.data,
          status:
            event.type === 'PENDING_CONFIRM' ? 'pending_confirm' : 'ask_human',
          events: [],
        }
        ensureAiCard().segments.push(toolSegment)
        activeToolSegment = toolSegment
      }
    } else if (event.type === 'TOOL_CALL_START') {
      activeToolSegment.status =
        activeToolSegment.status === 'completed'
          ? 'completed'
          : activeToolSegment.status
      const toolSegment: AiCardToolSegment = {
        id: createMessageId(),
        kind: 'tool',
        toolName: event.data,
        status: 'running',
        events: [],
      }
      ensureAiCard().segments.push(toolSegment)
      activeToolSegment = toolSegment
    }

    activeToolSegment.events.push({
      id: event.id,
      type: event.type as AiToolEventType,
      data: event.data,
      parameter: event.parameter,
      askHuman: event.askHuman,
    })

    if (event.type === 'PENDING_CONFIRM') {
      activeToolSegment.status = 'pending_confirm'
    }
    if (event.type === 'ASK_HUMAN') {
      activeToolSegment.status = 'ask_human'
    }
    if (event.type === 'TOOL_CALL_END') {
      activeToolSegment.status = 'completed'
      activeToolSegment = undefined
    }
  }

  for (const event of events) {
    if (event.type === 'USER') {
      currentAiCard = undefined
      currentErrorCard = undefined
      activeToolSegment = undefined
      cards.push({
        id: event.id,
        type: 'user',
        text: event.data,
      })
      continue
    }

    if (event.type === 'ERROR') {
      currentAiCard = undefined
      activeToolSegment = undefined
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
      if (activeToolSegment) {
        appendToolEvent(event)
      } else {
        appendTextSegment(event.data)
      }
      continue
    }

    appendToolEvent(event)
  }

  return cards
}

export function createAiMessageId(): string {
  return createMessageId()
}
