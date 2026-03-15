import React from 'react'
import { Button } from '@heroui/react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type {
  AiCardToolSegment,
  AiToolEvent,
  ConversationCard,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'

interface AiMessageListProps {
  cards: ConversationCard[]
  pendingConfirm?: PendingConfirmState
  pendingAskHuman?: PendingAskHumanState
  isLoading?: boolean
  onQuickSubmit: (value: string) => void
}

function getToolStatusLabel(segment: AiCardToolSegment): string {
  switch (segment.status) {
    case 'running':
      return '进行中'
    case 'pending_confirm':
      return '等待确认'
    case 'ask_human':
      return '等待输入'
    case 'completed':
      return '已完成'
  }
}

function getToolEventLabel(event: AiToolEvent): string {
  switch (event.type) {
    case 'TOOL_CALL_START':
      return 'TOOL_CALL_START'
    case 'TOOL_CALL_END':
      return 'TOOL_CALL_END'
    case 'PENDING_CONFIRM':
      return 'PENDING_CONFIRM'
    case 'ASK_HUMAN':
      return 'ASK_HUMAN'
    case 'TOKEN':
      return 'TOKEN'
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
    <div className="prose prose-sm max-w-none text-sm break-words">
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  )
}

const ToolEventLine: React.FC<{
  event: AiToolEvent
  pendingConfirm?: PendingConfirmState
  pendingAskHuman?: PendingAskHumanState
}> = ({ event, pendingConfirm, pendingAskHuman }) => {
  return (
    <div className="bg-default-50 border-default-200 rounded-md border px-2 py-1">
      <div className="text-default-600 text-[11px] font-semibold">
        {getToolEventLabel(event)}
      </div>
      {event.type === 'TOKEN' ? (
        <div className="text-default-700 mt-1 text-xs break-words whitespace-pre-wrap">
          {event.data}
        </div>
      ) : null}
      {event.type === 'TOOL_CALL_START' || event.type === 'TOOL_CALL_END' ? (
        <div className="text-default-700 mt-1 text-xs break-all">
          {event.data}
          {event.parameter ? ` (${event.parameter})` : ''}
        </div>
      ) : null}
      {event.type === 'PENDING_CONFIRM' ? (
        <div className="text-warning-700 mt-1 space-y-1 text-xs">
          <div>
            工具 {event.data} 等待确认
            {event.parameter ? ` (${event.parameter})` : ''}
          </div>
          {pendingConfirm?.toolName === event.data ? (
            <div>请在底部确认区选择 YES 或 NO</div>
          ) : null}
        </div>
      ) : null}
      {event.type === 'ASK_HUMAN' ? (
        <div className="text-primary-700 mt-1 space-y-1 text-xs">
          <div>{event.askHuman?.question || event.data}</div>
          {pendingAskHuman ? <div>请在底部输入区继续</div> : null}
        </div>
      ) : null}
    </div>
  )
}

const AiMessageList: React.FC<AiMessageListProps> = ({
  cards,
  pendingConfirm,
  pendingAskHuman,
  isLoading,
  onQuickSubmit,
}) => {
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
                <div className="mt-1 break-words whitespace-pre-wrap">
                  {card.text}
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
                      className="border-default-200 bg-content1 rounded-md border"
                      open={segment.status !== 'completed'}
                    >
                      <summary className="cursor-pointer px-2 py-1 text-xs font-semibold">
                        {segment.toolName} · {getToolStatusLabel(segment)}
                      </summary>
                      <div className="border-default-200 space-y-2 border-t p-2">
                        {segment.events.map((event) => (
                          <ToolEventLine
                            key={event.id}
                            event={event}
                            pendingConfirm={pendingConfirm}
                            pendingAskHuman={pendingAskHuman}
                          />
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}

        {pendingConfirm ? (
          <div className="border-warning-200 bg-warning-50 mx-8 rounded-lg border p-3">
            <div className="text-warning-700 text-sm">
              工具调用待确认: {pendingConfirm.toolName}
            </div>
            {pendingConfirm.parameter ? (
              <div className="text-warning-700 mt-1 text-xs break-all">
                参数: {pendingConfirm.parameter}
              </div>
            ) : null}
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                color="primary"
                onPress={() => onQuickSubmit('YES')}
              >
                批准
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => onQuickSubmit('NO')}
              >
                拒绝
              </Button>
            </div>
          </div>
        ) : null}

        {pendingAskHuman ? (
          <div className="border-primary-200 bg-primary-50 mx-8 rounded-lg border p-3">
            <div className="text-primary-700 text-sm">
              {pendingAskHuman.question || '请提供额外信息'}
            </div>
            <div className="text-primary-600 mt-1 text-xs">
              请直接在底部输入框输入回复并发送。
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="bg-default-100 text-default-500 mr-8 rounded-lg px-3 py-2 text-xs">
            AI 正在思考...
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AiMessageList
