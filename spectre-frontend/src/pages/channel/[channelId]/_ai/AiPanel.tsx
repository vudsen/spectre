import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addToast, Button, Tooltip } from '@heroui/react'
import clsx from 'clsx'
import { Rnd } from 'react-rnd'
import { type AiMessageDTO, chatByAiStream } from '@/api/impl/ai.ts'
import {
  getOrCreateConversationId,
  parseAskHumanRequest,
  resetConversationId,
} from '@/pages/channel/[channelId]/_ai/sse.ts'
import type {
  AiStreamMessage,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'
import { store, type RootState } from '@/store'
import { updateChannelContext } from '@/store/channelSlice.ts'
import { useDispatch, useSelector } from 'react-redux'
import i18n from '@/i18n'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import {
  aiPanelLayoutConstants,
  loadLayout,
  normalizeLayout,
  persistLayout,
  type AiPanelLayoutState,
} from '@/pages/channel/[channelId]/_ai/aiPanelLayout.ts'
import {
  buildConversationCards,
  createAiMessageId,
} from '@/pages/channel/[channelId]/_ai/aiConversationCards.ts'
import useAiPanelAvailability from '@/pages/channel/[channelId]/_ai/useAiPanelAvailability.ts'
import AiPanelContent from '@/pages/channel/[channelId]/_ai/AiPanelContent.tsx'

export interface AiPanelProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
}

function formatUserMessage(query: string, skillName?: string): string {
  if (!skillName) {
    return query
  }
  return `\`$${skillName}\` ${query}`
}

const AiPanel: React.FC<AiPanelProps> = ({ channelId, isOpen, onClose }) => {
  const { enabled } = useAiPanelAvailability()
  const [events, setEvents] = useState<AiStreamMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<
    PendingConfirmState | undefined
  >(undefined)
  const [pendingAskHuman, setPendingAskHuman] = useState<
    PendingAskHumanState | undefined
  >(undefined)
  const dispatch = useDispatch()
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < aiPanelLayoutConstants.mobileBreakpoint
      : false,
  )
  const [layout, setLayout] = useState<AiPanelLayoutState>(() =>
    typeof window !== 'undefined'
      ? loadLayout(channelId)
      : {
          x: aiPanelLayoutConstants.margin,
          y: aiPanelLayoutConstants.margin,
          width: aiPanelLayoutConstants.panelWidth,
          height: aiPanelLayoutConstants.panelHeight,
        },
  )
  const autoConfirm = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.autoConfirm,
  )
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setConversationId(getOrCreateConversationId(channelId))
    setEvents([])
    setPendingConfirm(undefined)
    setPendingAskHuman(undefined)
    if (typeof window !== 'undefined') {
      setLayout(loadLayout(channelId))
    }
  }, [channelId])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const onResize = () => {
      setIsMobile(window.innerWidth < aiPanelLayoutConstants.mobileBreakpoint)
      setLayout((prev) => normalizeLayout(prev))
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cards = useMemo(() => buildConversationCards(events), [events])

  const pushEvent = useCallback((next: Omit<AiStreamMessage, 'id'>) => {
    setEvents((prev) => [...prev, { ...next, id: createAiMessageId() }])
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
      if (!enabled || isLoading || !conversationId) {
        return
      }
      const activeSkill = store.getState().channel.context.selectedSkill
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const shouldRenderUserInput = !pendingConfirm
      setPendingConfirm(undefined)
      setPendingAskHuman(undefined)
      if (shouldRenderUserInput) {
        pushEvent({
          type: 'USER',
          data: formatUserMessage(query, activeSkill?.name),
        })
      }
      if (activeSkill) {
        dispatch(
          updateChannelContext({
            selectedSkill: undefined,
          }),
        )
      }
      setIsLoading(true)
      try {
        await chatByAiStream(
          {
            query,
            channelId,
            conversationId,
            skillId: activeSkill?.id,
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
      dispatch,
      enabled,
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

  const handleDesktopLayoutChange = useCallback(
    (nextLayout: AiPanelLayoutState) => {
      const normalized = normalizeLayout(nextLayout)
      setLayout(normalized)
      persistLayout(channelId, normalized)
    },
    [channelId],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Rnd
      disableDragging={isMobile}
      enableResizing={!isMobile}
      bounds="window"
      dragHandleClassName="ai-panel-drag-handle"
      minWidth={aiPanelLayoutConstants.minWidth}
      minHeight={aiPanelLayoutConstants.minHeight}
      maxWidth="90vw"
      maxHeight="85vh"
      size={
        isMobile
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : { width: layout.width, height: layout.height }
      }
      position={isMobile ? { x: 0, y: 0 } : { x: layout.x, y: layout.y }}
      onDragStop={(_e, data) => {
        if (isMobile) {
          return
        }
        handleDesktopLayoutChange({
          ...layout,
          x: data.x,
          y: data.y,
        })
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        if (isMobile) {
          return
        }
        handleDesktopLayoutChange({
          x: position.x,
          y: position.y,
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        })
      }}
      className={clsx(
        'z-50 overflow-hidden rounded-xl border shadow-lg',
        'bg-content1 border-default-200',
        isMobile ? 'rounded-none border-0 shadow-none' : '',
      )}
      style={{ position: 'fixed' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div
          className={clsx(
            'ai-panel-drag-handle flex items-center justify-between px-3 py-2',
            isMobile ? 'cursor-default' : 'cursor-move',
          )}
        >
          <div className="flex w-full items-center justify-between">
            <div className="grow opacity-0 transition-opacity hover:opacity-100!">
              <SvgIcon icon={Icon.GRIP}></SvgIcon>
            </div>
            <div>
              <Tooltip content={i18n.t('channel.resetSession')}>
                <Button
                  size="sm"
                  variant="light"
                  onPress={clearConversation}
                  isIconOnly
                  isDisabled={!enabled || isLoading}
                >
                  <SvgIcon icon={Icon.TRASH} />
                </Button>
              </Tooltip>
              <Button size="sm" variant="light" onPress={onClose} isIconOnly>
                <SvgIcon icon={Icon.CLOSE} />
              </Button>
            </div>
          </div>
        </div>
        <AiPanelContent
          enabled={enabled}
          cards={cards}
          pendingConfirm={pendingConfirm}
          pendingAskHuman={pendingAskHuman}
          autoConfirm={autoConfirm}
          isLoading={isLoading}
          eventsLength={events.length}
          onSubmit={submitQuery}
        />
      </div>
    </Rnd>
  )
}

export default AiPanel
