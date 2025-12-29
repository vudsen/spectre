import { useLocation, useNavigate } from 'react-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createChannel } from '@/api/impl/arthas.ts'
import { Button, Spinner } from '@heroui/react'

type PollState = {
  lastId?: number
  isStopped: boolean
}

interface ErrorCountdownProps {
  nextRetryTime?: number
  onOver?: () => void
  message: string
}

const STOP_RETRY_THRESHOLD = -100000

const ErrorCountdown: React.FC<ErrorCountdownProps> = ({
  nextRetryTime,
  message,
  onOver,
}) => {
  const [countdown, setCountdown] = useState(() => {
    if (!nextRetryTime) {
      return STOP_RETRY_THRESHOLD
    }
    return Math.trunc((nextRetryTime - Date.now()) / 1000)
  })
  useEffect(() => {
    if (countdown <= STOP_RETRY_THRESHOLD) {
      return
    }
    if (countdown <= 0) {
      onOver?.()
      return
    }
    const id = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)
    return () => {
      clearTimeout(id)
    }
  }, [countdown, onOver])

  const reload = () => {
    location.reload()
  }

  const cancelRetry = () => {
    setCountdown(STOP_RETRY_THRESHOLD)
  }

  return (
    <div className="space-y-2">
      <div className="text-danger text-lg font-bold">连接到 JVM 失败</div>
      <div className="text-danger">{message}</div>
      {countdown >= 0 ? (
        <div>
          <div className="text-secondary">{countdown} 秒后自动重试</div>
          <Button color="danger" variant="flat" onPress={cancelRetry}>
            取消重试
          </Button>
        </div>
      ) : (
        <Button color="danger" variant="flat" onPress={reload}>
          刷新
        </Button>
      )}
    </div>
  )
}

type ErrorInfo = {
  message: string
  nextRetryTime?: number
}

/**
 * 连接到 jvm 的加载界面
 */
const AttachPage = () => {
  const location = useLocation()
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>()
  const [progressInfo, setProgressInfo] = useState({
    title: '正在连接中',
    message: '连接中',
  })
  const pollState = useRef<PollState>({
    isStopped: false,
  })
  const nav = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const treeNodeId = searchParams.get('treeNodeId')
  const bundleId = searchParams.get('bundleId')
  const runtimeNodeId = searchParams.get('runtimeNodeId') ?? '-1'

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
    return <div>Jvm 参数为空</div>
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

export default AttachPage
