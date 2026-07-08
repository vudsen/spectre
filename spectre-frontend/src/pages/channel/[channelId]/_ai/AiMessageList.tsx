import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import i18n from '@/i18n'
import type {
  AiCardToolSegment,
  AiToolEvent,
  ConversationCard,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'
import remarkGfm from 'remark-gfm'
import 'github-markdown-css/github-markdown.css'

interface AiMessageListProps {
  cards: ConversationCard[]
  pendingConfirms: PendingConfirmState[]
  currentAskHuman?: PendingAskHumanState
  autoConfirm?: boolean
  isLoading?: boolean
  onConfirm: (toolCallId: string, value: 'YES' | 'NO') => void
  onAutoConfirmAll: () => void
}

function getToolStatusLabel(segment: AiCardToolSegment): string {
  switch (segment.status) {
    case 'waiting_execution':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_015')
    case 'pending_confirm':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_002')
    case 'pending_ask_human':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_003')
    case 'completed':
      return i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_004')
  }
}

function getToolContainerClassName(
  segment: AiCardToolSegment,
  isConfirmExecuting: boolean,
): string {
  if (segment.status === 'pending_confirm') {
    return clsx(
      'rounded-md border',
      isConfirmExecuting
        ? 'border-primary-200 bg-primary-50'
        : 'border-warning-300 bg-warning-100',
    )
  }
  return 'border-default bg-content1 rounded-md border'
}

function getToolEventLabel(event: AiToolEvent): string {
  switch (event.type) {
    case 'TOOL_CALL_START':
      return 'TOOL_CALL_START'
    case 'TOOL_CALL_END':
      return 'TOOL_CALL_END'
  }
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ children, className }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="bg-default-200 rounded px-1 py-0.5 font-mono text-xs">
          {children}
        </code>
      )
    }
    return (
      <code
        className={[className, 'font-mono text-xs break-normal whitespace-pre']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-default-100 mb-2 overflow-x-auto rounded-md p-2 last:mb-0">
      {children}
    </pre>
  ),
}

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div
      className="prose prose-sm markdown-body max-w-none text-sm break-words"
      style={{ backgroundColor: 'inherit' }}
    >
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

const ToolEventLine: React.FC<{
  event: AiToolEvent
}> = ({ event }) => {
  return (
    <div className="bg-default-50 border-default-200 rounded-md border px-2 py-1">
      <div className="text-default-600 text-[11px] font-semibold">
        {getToolEventLabel(event)}
      </div>
      <div className="text-default-700 mt-1 text-xs break-all">
        {event.parameter}
      </div>
    </div>
  )
}

const AiMessageList: React.FC<AiMessageListProps> = ({
  cards,
  pendingConfirms,
  currentAskHuman,
  autoConfirm,
  isLoading,
  onConfirm,
  onAutoConfirmAll,
}) => {
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<
    number | null
  >(null)
  const autoConfirmRef = useRef(onAutoConfirmAll)

  useEffect(() => {
    autoConfirmRef.current = onAutoConfirmAll
  }, [onAutoConfirmAll])

  useEffect(() => {
    const unresolvedConfirms = pendingConfirms.filter((item) => !item.content)
    if (unresolvedConfirms.length === 0 || !autoConfirm) {
      setAutoConfirmCountdown(null)
      return
    }

    let remainSeconds = 3
    setAutoConfirmCountdown(remainSeconds)
    const intervalId = window.setInterval(() => {
      remainSeconds -= 1
      setAutoConfirmCountdown(Math.max(remainSeconds, 0))
    }, 1000)
    const timeoutId = window.setTimeout(() => {
      autoConfirmRef.current()
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [autoConfirm, pendingConfirms])

  const pendingConfirmMap = new Map(
    pendingConfirms.map((pendingConfirm) => [
      pendingConfirm.toolCallId,
      pendingConfirm,
    ]),
  )
  const allPendingConfirmsResolved =
    pendingConfirms.length > 0 &&
    pendingConfirms.every((item) => item.content) &&
    !currentAskHuman

  return (
    <div className="h-0 grow overflow-y-auto px-3 py-2">
      <div className="space-y-3">
        {cards.map((card) => {
          if (card.type === 'user') {
            return (
              <div
                key={card.id}
                className="bg-primary-100 text-primary-900 ml-10 rounded-lg px-3 py-2 text-sm"
              >
                <div className="text-xs font-semibold">User</div>
                <div className="mt-1 break-words">
                  <MarkdownText text={card.text} />
                </div>
              </div>
            )
          }

          if (card.type === 'error') {
            return (
              <div
                key={card.id}
                className="border-danger-200 bg-danger-50 text-danger-700 mr-8 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="text-xs font-semibold">Error</div>
                <div className="mt-1 space-y-1">
                  {card.messages.map((message, index) => (
                    <div
                      key={`${card.id}-error-${index}`}
                      className="break-words"
                    >
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div
              key={card.id}
              className="border-default-200 bg-default-50 mr-8 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="text-default-600 text-xs font-semibold">AI</div>
              <div className="mt-2 space-y-2">
                {card.segments.map((segment) => {
                  if (segment.kind === 'text') {
                    return (
                      <MarkdownText key={segment.id} text={segment.markdown} />
                    )
                  }

                  return (
                    <details
                      key={segment.id}
                      className={getToolContainerClassName(
                        segment,
                        allPendingConfirmsResolved,
                      )}
                      open={segment.status !== 'completed'}
                    >
                      <summary className="cursor-pointer px-2 py-1 text-xs font-semibold">
                        {segment.toolName} ·{' '}
                        {segment.status === 'pending_confirm' &&
                        allPendingConfirmsResolved
                          ? i18n.t(
                              'hardcoded.msg_pages_channel_param_ai_aimessagelist_001',
                            )
                          : getToolStatusLabel(segment)}
                      </summary>
                      <div className="border-default-200 space-y-2 border-t p-2">
                        {segment.parameter ? (
                          <div className="text-default-600 text-xs break-all">
                            {segment.parameter}
                          </div>
                        ) : null}
                        {segment.status === 'pending_confirm' &&
                        pendingConfirmMap.has(segment.toolCallId) ? (
                          <div className="flex gap-2">
                            {!allPendingConfirmsResolved ? (
                              <>
                                <Button
                                  size="sm"
                                  color={
                                    pendingConfirmMap.get(segment.toolCallId)
                                      ?.content === 'YES'
                                      ? 'primary'
                                      : 'default'
                                  }
                                  variant={
                                    pendingConfirmMap.get(segment.toolCallId)
                                      ?.content === 'YES'
                                      ? 'solid'
                                      : 'flat'
                                  }
                                  onPress={() =>
                                    onConfirm(segment.toolCallId, 'YES')
                                  }
                                >
                                  {i18n.t(
                                    'hardcoded.msg_pages_channel_param_ai_aimessagelist_010',
                                  )}
                                  {autoConfirm &&
                                  autoConfirmCountdown !== null &&
                                  !pendingConfirmMap.get(segment.toolCallId)
                                    ?.content
                                    ? ` (${autoConfirmCountdown}s)`
                                    : ''}
                                </Button>
                                <Button
                                  size="sm"
                                  color={
                                    pendingConfirmMap.get(segment.toolCallId)
                                      ?.content === 'NO'
                                      ? 'danger'
                                      : 'default'
                                  }
                                  variant={
                                    pendingConfirmMap.get(segment.toolCallId)
                                      ?.content === 'NO'
                                      ? 'solid'
                                      : 'flat'
                                  }
                                  onPress={() =>
                                    onConfirm(segment.toolCallId, 'NO')
                                  }
                                >
                                  {i18n.t(
                                    'hardcoded.msg_pages_channel_param_ai_aimessagelist_011',
                                  )}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        {segment.events.map((event) => (
                          <ToolEventLine key={event.id} event={event} />
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}

        {currentAskHuman ? (
          <div className="border-primary-200 bg-primary-50 mx-8 rounded-lg border p-3">
            <div className="text-primary-700 text-sm">
              {currentAskHuman.question ||
                i18n.t(
                  'hardcoded.msg_pages_channel_param_ai_aimessagelist_012',
                )}
            </div>
            <div className="text-primary-600 mt-1 text-xs">
              {i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_013')}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="bg-default-100 text-default-500 mr-8 rounded-lg px-3 py-2 text-xs">
            {i18n.t('hardcoded.msg_pages_channel_param_ai_aimessagelist_014')}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AiMessageList
