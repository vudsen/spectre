import React, { useCallback } from 'react'
import { Button, Code, Tooltip } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateChannelContext } from '@/store/channelSlice.ts'
import { showDialog } from '@/common/util.ts'
import { disconnectSession } from '@/api/impl/arthas.ts'
import { useNavigate } from 'react-router'

interface ToolbarProps {
  appName: string
  channelId: string
}

const Toolbar: React.FC<ToolbarProps> = (props) => {
  const isDebugMode = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.isDebugMode,
  )
  const dispatch = useDispatch()
  const nav = useNavigate()

  const setDebugMode = useCallback(
    (s: boolean) => {
      dispatch(
        updateChannelContext({
          isDebugMode: s,
        }),
      )
    },
    [dispatch],
  )

  const disconnect = useCallback(() => {
    showDialog({
      title: '断开连接',
      message: '您可能会丢失所有的消息，确定断开连接吗?',
      color: 'danger',
      onConfirm() {
        // TODO fullscreen mask.
        disconnectSession(props.channelId).then(() => {
          nav('/runtime-node/list')
        })
      },
    })
  }, [nav, props.channelId])

  return (
    <div className="h-navbar mx-3 flex items-center justify-between">
      <div className="flex max-w-1/2 items-center">
        <span className="font-bold text-nowrap">&gt; 已连接到:&nbsp;</span>
        <Tooltip content={props.appName}>
          <Code className="cursor-pointer truncate" color="primary">
            {props.appName}
          </Code>
        </Tooltip>
      </div>
      <div>
        <Tooltip content="开启 DEBUG 模式">
          <Button
            isIconOnly
            variant="light"
            onPress={() => setDebugMode(!isDebugMode)}
            className={isDebugMode ? 'text-primary' : ''}
          >
            <SvgIcon icon={Icon.BUG} size={22} />
          </Button>
        </Tooltip>
        <Tooltip content="断开连接">
          <Button
            isIconOnly
            variant="light"
            color="danger"
            onPress={disconnect}
          >
            <SvgIcon icon={Icon.DISCONNECT} size={22} />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export default Toolbar
