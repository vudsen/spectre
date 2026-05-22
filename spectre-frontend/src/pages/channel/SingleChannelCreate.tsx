import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import i18n from '@/i18n'
import { createChannel } from '@/api/impl/arthas.ts'
import ErrorCountdown from '@/pages/channel/ErrorCountdown.tsx'
import { Spinner } from '@heroui/react'

interface SingleChannelCreateProps {
  treeNodeId: string
  bundleId: string
  runtimeNodeId: string
}

type ErrorInfo = {
  message: string
  nextRetryTime?: string
}

type PollState = {
  lastId?: number
  isStopped: boolean
}

const SingleChannelCreate: React.FC<SingleChannelCreateProps> = ({
  bundleId,
  runtimeNodeId,
  treeNodeId,
}) => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>()
  const [progressInfo, setProgressInfo] = useState({
    title: i18n.t('hardcoded.msg_pages_channel_index_005'),
    message: i18n.t('hardcoded.msg_pages_channel_index_006'),
  })
  const pollState = useRef<PollState>({
    isStopped: false,
  })
  const nav = useNavigate()

  const tryCreateChannel = useCallback(
    (runtimeNodeId: string, treeNodeId: string) => {
      if (pollState.current.isStopped) {
        return
      }
      pollState.current.lastId = setTimeout(() => {
        createChannel(runtimeNodeId, treeNodeId, bundleId!)
          .then((r) => {
            if (r.isReady) {
              nav(`/channel/${r.channelId}`)
            } else if (r.error) {
              setErrorInfo(r.error)
            } else {
              setProgressInfo((old) => ({
                title: r.title ?? old.title,
                message: r.message ?? old.message,
              }))
              tryCreateChannel(runtimeNodeId, treeNodeId)
            }
          })
          .catch((e) => {
            setErrorInfo({
              message: e.message,
            })
          })
      }, 1000)
    },
    [bundleId, nav],
  )

  useEffect(() => {
    if (!treeNodeId) {
      return
    }
    const state = pollState.current
    state.isStopped = false
    tryCreateChannel(runtimeNodeId, treeNodeId)
    return () => {
      if (state.lastId) {
        clearTimeout(state.lastId)
      }
      state.isStopped = true
    }
  }, [runtimeNodeId, treeNodeId, tryCreateChannel])

  const onCountdownOver = useCallback(() => {
    setErrorInfo(undefined)
    tryCreateChannel(runtimeNodeId, treeNodeId!)
  }, [runtimeNodeId, treeNodeId, tryCreateChannel])

  if (!treeNodeId) {
    return <div>{i18n.t('hardcoded.msg_pages_channel_index_007')}</div>
  }
  return (
    <div className="-mt-navbar flex h-screen w-full items-center text-center">
      <div className="w-full space-y-2 text-center">
        {errorInfo ? (
          <ErrorCountdown
            message={errorInfo.message}
            nextRetryTime={errorInfo.nextRetryTime}
            onOver={onCountdownOver}
          />
        ) : (
          <div>
            <Spinner variant="wave" />
            <div className="text-primary text-lg font-bold">
              {progressInfo.title}
            </div>
            <div className="text-secondary">{progressInfo.message}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleChannelCreate
