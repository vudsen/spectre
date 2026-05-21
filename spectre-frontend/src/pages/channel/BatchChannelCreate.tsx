import React, { useEffect, useMemo, useRef, useState } from 'react'
import i18n from '@/i18n'
import { batchCreateChannel, type AttachStatus } from '@/api/impl/arthas.ts'
import { Spinner } from '@heroui/react'

export interface BatchChannelCreateProps {
  channels: { treeNodeId: string; bundleId: string; runtimeNodeId: string }[]
}

type ChannelState = 'pending' | 'success' | 'error'

type ChannelStatus = {
  key: string
  treeNodeId: string
  runtimeNodeId: string
  bundleId: string
  state: ChannelState
  channelId?: string
  title?: string
  lastMessage?: string
  messageHistory: string[]
  errorMessage?: string
  nextRetryTime?: number
}

const POLL_INTERVAL = 1000

const makeChannelKey = (
  channel: BatchChannelCreateProps['channels'][number],
  index: number,
) =>
  `${channel.runtimeNodeId}::${channel.treeNodeId}::${channel.bundleId}::${index}`

const BatchChannelCreate: React.FC<BatchChannelCreateProps> = ({
  channels,
}) => {
  const [statusMap, setStatusMap] = useState<Record<string, ChannelStatus>>({})
  const statusMapRef = useRef<Record<string, ChannelStatus>>({})
  const pollState = useRef<{ timerId?: number; stopped: boolean }>({
    stopped: false,
  })

  const channelList = useMemo(
    () =>
      channels.map((channel, index) => ({
        ...channel,
        key: makeChannelKey(channel, index),
      })),
    [channels],
  )

  useEffect(() => {
    const initialMap: Record<string, ChannelStatus> = {}
    for (const channel of channelList) {
      initialMap[channel.key] = {
        key: channel.key,
        treeNodeId: channel.treeNodeId,
        runtimeNodeId: channel.runtimeNodeId,
        bundleId: channel.bundleId,
        state: 'pending',
        messageHistory: [],
      }
    }
    setStatusMap(initialMap)
    statusMapRef.current = initialMap
  }, [channelList])

  useEffect(() => {
    const state = pollState.current
    state.stopped = false

    const poll = (targets: typeof channelList) => {
      if (state.stopped || targets.length === 0) {
        return
      }
      state.timerId = setTimeout(() => {
        batchCreateChannel(targets)
          .then((result) => {
            if (state.stopped) {
              return
            }
            const nextTargets: typeof channelList = []
            const updates: Record<string, ChannelStatus> = {}
            for (let index = 0; index < targets.length; index++) {
              const target = targets[index]
              const attachStatus: AttachStatus | undefined = result[index]
              const previous = statusMapRef.current[target.key] ?? {
                key: target.key,
                treeNodeId: target.treeNodeId,
                runtimeNodeId: target.runtimeNodeId,
                bundleId: target.bundleId,
                state: 'pending' as ChannelState,
                messageHistory: [],
              }
              const mergedHistory = previous.messageHistory.slice()
              const message = attachStatus?.message
              if (message) {
                mergedHistory.push(message)
              }
              if (attachStatus?.isReady) {
                updates[target.key] = {
                  ...previous,
                  state: 'success',
                  channelId: attachStatus.channelId ?? previous.channelId,
                  title: attachStatus.title ?? previous.title,
                  lastMessage: message ?? previous.lastMessage,
                  messageHistory: mergedHistory,
                  errorMessage: undefined,
                  nextRetryTime: undefined,
                }
              } else if (attachStatus?.error) {
                updates[target.key] = {
                  ...previous,
                  state: 'error',
                  title: attachStatus.title ?? previous.title,
                  lastMessage: message ?? previous.lastMessage,
                  messageHistory: mergedHistory,
                  errorMessage: attachStatus.error.message,
                  nextRetryTime: attachStatus.error.nextRetryTime,
                }
                nextTargets.push(target)
              } else {
                updates[target.key] = {
                  ...previous,
                  state: 'pending',
                  title: attachStatus?.title ?? previous.title,
                  lastMessage: message ?? previous.lastMessage,
                  messageHistory: mergedHistory,
                  errorMessage: undefined,
                  nextRetryTime: undefined,
                }
                nextTargets.push(target)
              }
            }
            setStatusMap((old) => {
              const next = {
                ...old,
                ...updates,
              }
              statusMapRef.current = next
              return next
            })
            if (nextTargets.length > 0) {
              poll(nextTargets)
            }
          })
          .catch((e) => {
            if (state.stopped) {
              return
            }
            setStatusMap((old) => {
              const next = { ...old }
              for (const target of targets) {
                const previous = old[target.key]
                if (!previous || previous.state === 'success') {
                  continue
                }
                next[target.key] = {
                  ...previous,
                  state: 'error',
                  errorMessage: e.message,
                }
              }
              statusMapRef.current = next
              return next
            })
            poll(targets)
          })
      }, POLL_INTERVAL)
    }

    if (channelList.length > 0) {
      poll(channelList)
    }

    return () => {
      state.stopped = true
      if (state.timerId) {
        clearTimeout(state.timerId)
      }
    }
  }, [channelList])

  const statusList = useMemo(
    () => channelList.map((channel) => statusMap[channel.key]).filter(Boolean),
    [channelList, statusMap],
  )
  const totalCount = channelList.length
  const successCount = statusList.filter(
    (item) => item.state === 'success',
  ).length
  const isDone = totalCount > 0 && successCount === totalCount

  if (totalCount === 0) {
    return <div>{i18n.t('channel.batchArgsEmpty')}</div>
  }

  return (
    <div className="-mt-navbar h-screen w-full overflow-auto px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="border-default-200 bg-content1 flex items-center justify-between rounded-lg border px-4 py-3">
          <div className="text-foreground text-sm font-semibold">
            {i18n.t('channel.successCounter', {
              successCount,
              totalCount,
            })}
          </div>
          {!isDone && <Spinner size="sm" variant="wave" />}
        </div>

        <div className="space-y-3">
          {statusList.map((item) => (
            <div
              key={item.key}
              className="border-default-200 rounded-lg border p-3"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="font-medium">
                  {item.treeNodeId} / {item.runtimeNodeId}
                </div>
                <div
                  className={
                    item.state === 'success'
                      ? 'text-success'
                      : item.state === 'error'
                        ? 'text-danger'
                        : 'text-warning'
                  }
                >
                  {item.state === 'success'
                    ? i18n.t('channel.connected')
                    : item.state === 'error'
                      ? i18n.t('channel.connectFailed')
                      : i18n.t('channel.connecting')}
                </div>
              </div>

              <div className="bg-content2 text-foreground-600 max-h-40 overflow-auto rounded-md p-2 font-mono text-xs leading-6">
                {item.messageHistory.length === 0 ? (
                  <div>{i18n.t('channel.noLogs')}</div>
                ) : (
                  item.messageHistory.map((message, index) => (
                    <div key={`${item.key}-message-${index}`}>{message}</div>
                  ))
                )}
                {item.errorMessage && (
                  <div className="text-danger mt-1">
                    {i18n.t('channel.error', {
                      message: item.errorMessage,
                    })}
                  </div>
                )}
                {item.nextRetryTime && (
                  <div className="text-warning mt-1">
                    {i18n.t('channel.nextRetry', {
                      time: new Date(item.nextRetryTime).toLocaleTimeString(),
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {isDone && (
          <div className="border-success-300 bg-success-50 text-success-700 rounded-lg border px-4 py-3 text-sm">
            {i18n.t('hardcoded.msg_pages_channel_batch_create_009')}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchChannelCreate
