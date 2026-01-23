import React, { type FormEvent, useCallback, useState } from 'react'
import {
  Button,
  Code,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateChannelContext } from '@/store/channelSlice.ts'
import { showDialog } from '@/common/util.ts'
import { disconnectSession } from '@/api/impl/arthas.ts'
import { useNavigate } from 'react-router'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import QuickCommand, {
  type QuickCommandRef,
} from '@/pages/channel/[channelId]/_component/QuickCommand'

interface ToolbarProps {
  appName: string
  channelId: string
  ref: React.RefObject<QuickCommandRef | null>
}

const Header: React.FC<ToolbarProps> = (props) => {
  const isDebugMode = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.isDebugMode,
  )
  const classloaderHash = useSelector<RootState, string | undefined>(
    (state) => state.channel.context.classloaderHash,
  )
  const [isClassloaderSetterOpen, setClassloaderStterOpen] = useState(false)
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

  const toHome = () => {
    nav('/')
  }

  const saveClassloaderHash = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const target = e.target as HTMLFormElement
    const data = new FormData(target)
    const hash = data.get('hash')
    dispatch(
      updateChannelContext({
        classloaderHash:
          typeof hash === 'string' && hash.length > 0 ? hash : undefined,
      }),
    )
    setClassloaderStterOpen(false)
  }

  return (
    <div className="border-b-divider mx-3 flex items-center justify-between border-b-1">
      <div className="flex max-w-1/2 items-center">
        <span className="font-bold text-nowrap">&gt; 已连接到:&nbsp;</span>
        <Tooltip
          content={props.appName}
          isOpen={isClassloaderSetterOpen}
          onOpenChange={(open) => setClassloaderStterOpen(open)}
        >
          <Code className="cursor-pointer truncate" color="primary">
            {props.appName}
          </Code>
        </Tooltip>
      </div>
      <div className="flex items-center">
        <QuickCommand ref={props.ref} />
        <Popover>
          <PopoverTrigger className="mr-2">
            <div className="flex cursor-pointer items-center text-sm">
              <SvgIcon icon={ChannelIcon.HASH} />
              {classloaderHash ?? '<default>'}
              <SvgIcon icon={Icon.RIGHT_ARROW} className="rotate-90" />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <form className="flex flex-col pt-3" onSubmit={saveClassloaderHash}>
              <Input
                label="Classloader Hash"
                name="hash"
                defaultValue={classloaderHash}
                labelPlacement="outside-top"
              />
              <Button
                type="submit"
                color="primary"
                size="sm"
                variant="light"
                className="mt-2 self-end"
              >
                保存
              </Button>
            </form>
          </PopoverContent>
        </Popover>
        <Tooltip content="回到首页">
          <Button isIconOnly variant="light" onPress={toHome}>
            <SvgIcon icon={Icon.HOME} size={22} />
          </Button>
        </Tooltip>
        <Tooltip content="显示所有消息">
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

export default Header
