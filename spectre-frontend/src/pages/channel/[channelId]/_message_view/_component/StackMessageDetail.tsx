import type { DetailComponentProps } from '../factory.ts'
import React, { useCallback, useMemo } from 'react'
import Time from '@/components/Time.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { Button, Tooltip } from '@heroui/react'
import { setTipRead } from '@/store/tipSlice'
import StackTrace from '@/pages/channel/[channelId]/_message_view/_component/_common/StackTrace.tsx'
import i18n from '@/i18n'

type Trace = {
  fileName: string
  lineNumber: number
  className: string
  methodName: string
}

type StackMessage = {
  type: 'stack'
  threadId: number
  threadName: string
  ts: string
  classloader: string
  cost: number
  daemon: boolean
  jobId: number
  priority: number
  stackTrace: Trace[]
}

type KV = {
  name: string
  value: React.ReactNode
}

const StackMessageDetail: React.FC<DetailComponentProps<StackMessage>> = ({
  msg,
  onDirty,
}) => {
  const channelRightClickMenuTip = useSelector<RootState, boolean | undefined>(
    (state) => state.tip.channelRightClickMenuTip,
  )
  const dispatch = useDispatch()
  const keyValues: KV[] = useMemo(
    () => [
      {
        name: 'ID',
        value: msg.threadId,
      },
      {
        name: 'Time',
        value: <Time time={msg.ts} />,
      },
      {
        name: 'Daemon',
        value: msg.daemon.toString(),
      },
    ],
    [msg],
  )

  const hideRightClickTip = useCallback(() => {
    dispatch(
      setTipRead({
        channelRightClickMenuTip: true,
      }),
    )
  }, [dispatch])

  return (
    <div className="inline-block">
      <Tooltip
        content={
          <div className="flex flex-col">
            <div className="mt-2">
              {i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_stackmessagedetail_001',
              )}
            </div>
            <Button
              className="mt-2 self-end"
              variant="light"
              color="primary"
              onPress={hideRightClickTip}
            >
              {i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_stackmessagedetail_002',
              )}
            </Button>
          </div>
        }
        isOpen={!channelRightClickMenuTip}
        showArrow
        placement="top-start"
      >
        <div>
          <span className="font-bold">{msg.threadName} (</span>
          {keyValues.map((kv, index) => (
            <span key={kv.name}>
              {index !== 0 ? <span>; </span> : null}
              <span>{kv.name}</span>
              <span> = </span>
              <span className="text-default-500">{kv.value}</span>
            </span>
          ))}
          <span>)</span>
        </div>
      </Tooltip>
      <StackTrace traces={msg.stackTrace} onDirty={onDirty} />
    </div>
  )
}

export default StackMessageDetail
