import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addToast, Button } from '@heroui/react'
import clsx from 'clsx'
import { type AiMessageDTO, chatByAiStream } from '@/api/impl/ai.ts'
import AiComposer from '@/pages/channel/[channelId]/_ai/AiComposer.tsx'
import AiMessageList from '@/pages/channel/[channelId]/_ai/AiMessageList.tsx'
import {
  getOrCreateConversationId,
  parseAskHumanRequest,
  resetConversationId,
} from '@/pages/channel/[channelId]/_ai/sse.ts'
import type {
  AiCardToolSegment,
  AiStreamMessage,
  AiToolEventType,
  ConversationCard,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'
import { store, type RootState } from '@/store'
import { useSelector } from 'react-redux'
import i18n from '@/i18n'

interface AiPanelProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
}

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

function buildConversationCards(events: AiStreamMessage[]): ConversationCard[] {
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

const AI_PANEL_WIDTH = 620

const AiPanel: React.FC<AiPanelProps> = ({ channelId, isOpen, onClose }) => {
  const [events, setEvents] = useState<AiStreamMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<
    PendingConfirmState | undefined
  >(undefined)
  const [pendingAskHuman, setPendingAskHuman] = useState<
    PendingAskHumanState | undefined
  >(undefined)
  const autoConfirm = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.autoConfirm,
  )
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setConversationId(getOrCreateConversationId(channelId))
    setEvents([])
    setPendingConfirm(undefined)
    setPendingAskHuman(undefined)
  }, [channelId])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const cards = useMemo(() => buildConversationCards(events), [events])

  const pushEvent = useCallback((next: Omit<AiStreamMessage, 'id'>) => {
    setEvents((prev) => [...prev, { ...next, id: createMessageId() }])
  }, [])

  const handleAiMessage = useCallback(
    (msg: AiMessageDTO) => {
      switch (msg.type) {
        case 'TOKEN': {
          pushEvent({
            type: 'TOKEN',
            data: msg.data,
          })
          break
        }
        case 'TOOL_CALL_START': {
          pushEvent({
            type: 'TOOL_CALL_START',
            data: msg.data,
            parameter: msg.parameter || undefined,
          })
          break
        }
        case 'TOOL_CALL_END': {
          setPendingConfirm(undefined)
          setPendingAskHuman(undefined)
          pushEvent({
            type: 'TOOL_CALL_END',
            data: msg.data,
            parameter: msg.parameter || undefined,
          })
          break
        }
        case 'PENDING_CONFIRM': {
          setPendingConfirm({
            toolName: msg.data,
            parameter: msg.parameter || undefined,
          })
          pushEvent({
            type: 'PENDING_CONFIRM',
            data: msg.data,
            parameter: msg.parameter || undefined,
          })
          break
        }
        case 'ASK_HUMAN': {
          const askHuman = parseAskHumanRequest(msg.parameter, msg.data)
          setPendingAskHuman(askHuman)
          pushEvent({
            type: 'ASK_HUMAN',
            data: msg.data,
            parameter: msg.parameter || undefined,
            askHuman,
          })
          break
        }
        case 'ERROR': {
          setPendingConfirm(undefined)
          setPendingAskHuman(undefined)
          pushEvent({
            type: 'ERROR',
            data: msg.data,
          })
          break
        }
      }
    },
    [pushEvent],
  )

  const submitQuery = useCallback(
    async (query: string) => {
      if (isLoading || !conversationId) {
        return
      }
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const shouldRenderUserInput = !pendingConfirm
      setPendingConfirm(undefined)
      setPendingAskHuman(undefined)
      if (shouldRenderUserInput) {
        pushEvent({
          type: 'USER',
          data: query,
        })
      }
      setIsLoading(true)
      try {
        await chatByAiStream(
          {
            query,
            channelId,
            conversationId,
            skillId: store.getState().channel.context.selectedSkill?.id,
          },
          {
            signal: abortRef.current.signal,
            onMessage: handleAiMessage,
          },
        )
      } catch (e) {
        if (abortRef.current?.signal.aborted) {
          return
        }
        pushEvent({
          type: 'ERROR',
          data:
            e instanceof Error
              ? e.message
              : i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_004'),
        })
      } finally {
        setIsLoading(false)
      }
    },
    [
      channelId,
      conversationId,
      handleAiMessage,
      isLoading,
      pendingConfirm,
      pushEvent,
    ],
  )

  const clearConversation = () => {
    abortRef.current?.abort()
    const nextConversationId = resetConversationId(channelId)
    setConversationId(nextConversationId)
    setEvents([])
    setPendingConfirm(undefined)
    setPendingAskHuman(undefined)
    addToast({
      title: i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_005'),
      color: 'success',
    })
  }

  return (
    <div
      className={clsx(
        'bg-content1 border-l-divider flex h-screen flex-col overflow-hidden transition-[width] duration-200',
        isOpen ? 'border-l' : 'border-l-0',
      )}
      style={{ width: isOpen ? AI_PANEL_WIDTH : 0 }}
    >
      {isOpen ? (
        <>
          <div className="border-b-divider flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-bold">
              {i18n.t('hardcoded.msg_pages_channel_param_header_005')}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="flat" onPress={clearConversation}>
                {i18n.t('hardcoded.msg_pages_channel_param_ai_aipanel_006')}
              </Button>
              <Button size="sm" variant="light" onPress={onClose}>
                {i18n.t(
                  'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_002',
                )}
              </Button>
            </div>
          </div>
          <AiMessageList
            cards={cards}
            pendingConfirm={pendingConfirm}
            pendingAskHuman={pendingAskHuman}
            autoConfirm={autoConfirm}
            isLoading={isLoading}
            onQuickSubmit={(value) => {
              void submitQuery(value)
            }}
          />
          <AiComposer disabled={isLoading} onSubmit={submitQuery} />
        </>
      ) : null}
    </div>
  )
}

export default AiPanel
