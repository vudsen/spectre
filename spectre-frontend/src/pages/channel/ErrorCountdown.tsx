import { useEffect, useState } from 'react'
import i18n from '@/i18n'
import { Button } from '@heroui/react'

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
      <div className="text-danger text-lg font-bold">
        {i18n.t('hardcoded.msg_pages_channel_index_001')}
      </div>
      <div className="text-danger">{message}</div>
      {countdown >= 0 ? (
        <div>
          <div className="text-secondary">
            {countdown} {i18n.t('hardcoded.msg_pages_channel_index_002')}
          </div>
          <Button color="danger" variant="flat" onPress={cancelRetry}>
            {i18n.t('hardcoded.msg_pages_channel_index_003')}
          </Button>
        </div>
      ) : (
        <Button color="danger" variant="flat" onPress={reload}>
          {i18n.t('hardcoded.msg_pages_channel_index_004')}
        </Button>
      )}
    </div>
  )
}

export default ErrorCountdown
