import { beforeAll, describe, expect, it, vi } from 'vitest'
import type {
  AiStreamMessage,
  ConversationCard,
} from '@/pages/channel/[channelId]/_ai/types.ts'

let buildConversationCards: (events: AiStreamMessage[]) => ConversationCard[]

beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'zh-CN'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
  ;({ buildConversationCards } = await import(
    '@/pages/channel/[channelId]/_ai/aiConversationCards.ts'
  ))
})

describe('buildConversationCards', () => {
  it('renders multiple tool calls from one round independently', () => {
    const events: AiStreamMessage[] = [
      {
        id: 'user-1',
        type: 'USER',
        data: 'help me',
      },
      {
        id: 'tool-start-1',
        type: 'TOOL_CALL_START',
        data: 'confirm_tool',
        parameter: '{"foo":"bar"}',
        toolCallId: 'tool-1',
        toolStatus: 'PENDING_CONFIRM',
      },
      {
        id: 'tool-start-2',
        type: 'TOOL_CALL_START',
        data: 'plain_tool',
        parameter: '{"hello":"world"}',
        toolCallId: 'tool-2',
        toolStatus: 'PENDING_EXECUTION',
      },
      {
        id: 'tool-end-1',
        type: 'TOOL_CALL_END',
        data: 'confirm_tool',
        parameter: 'done',
        toolCallId: 'tool-1',
      },
    ]

    const cards = buildConversationCards(events)
    const aiCard = cards.find((card) => card.type === 'ai')

    expect(aiCard?.type).toBe('ai')
    if (!aiCard || aiCard.type !== 'ai') {
      return
    }

    const toolSegments = aiCard.segments.filter(
      (segment) => segment.kind === 'tool',
    )
    expect(toolSegments).toHaveLength(2)

    const firstSegment = toolSegments[0]
    const secondSegment = toolSegments[1]
    if (firstSegment.kind !== 'tool' || secondSegment.kind !== 'tool') {
      return
    }

    expect(firstSegment.toolCallId).toBe('tool-1')
    expect(firstSegment.status).toBe('completed')
    expect(secondSegment.toolCallId).toBe('tool-2')
    expect(secondSegment.status).toBe('waiting_execution')
  })
})
