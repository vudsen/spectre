import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { type RootState, store } from '@/store'
import ArthasResponseItem, {
  type ResponseGroupItem,
} from '@/pages/channel/[channelId]/_tabs/_console/_component/ArthasResponseItem.tsx'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { ArthasMessageBus } from '@/pages/channel/[channelId]/useArthasMessageBus.tsx'
import type { StatusMessage } from '@/pages/channel/[channelId]/_message_view/_component/StatusMessageDetail.tsx'
import RightClickMenu, {
  type RightClickMenuItem,
} from '@/components/RightClickMenu/RightClickMenu.tsx'
import useRightClickMenu from '@/components/RightClickMenu/useRightClickMenu.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import i18n from '@/i18n'

interface ArthasResponseListProps {
  onEntitySelect: (e: ArthasMessage) => void
}

const IGNORED_TYPES = new Set(['input_status', 'command'])
function buildArray0(bus: ArthasMessageBus) {
  const channelSlice = store.getState().channel
  const isDebugMode = channelSlice.context.isDebugMode
  return buildArray(bus.messages, undefined, isDebugMode)
}

function buildArray(
  messages: ArthasMessage[],
  previousMessage?: ResponseGroupItem,
  isDebugMode?: boolean,
): ResponseGroupItem[] {
  let result: ResponseGroupItem[]
  if (isDebugMode) {
    result = messages.map((msg) => ({
      entity: msg,
    }))
  } else {
    result = []
    let lastJobId = previousMessage?.entity.value.jobId ?? -1
    let groupColorFlag = previousMessage?.colorFlag ?? -1
    let lastMsgType = previousMessage ? previousMessage.entity.value.type : ''
    for (const entity of messages) {
      const type = entity.value.type
      if (IGNORED_TYPES.has(type)) {
        continue
      } else if (
        type === 'status' &&
        (entity.value as StatusMessage).statusCode === 0
      ) {
        continue
      }
      // dashboard 仅显示第一条
      if ('dashboard' === type && lastMsgType === type) {
        continue
      }
      lastMsgType = type
      if (entity.value.jobId === lastJobId) {
        result.push({
          entity,
          colorFlag: groupColorFlag,
        })
      } else {
        groupColorFlag++
        if (groupColorFlag === 2) {
          groupColorFlag = 0
        }
        result.push({
          entity,
          colorFlag: groupColorFlag,
        })
      }
      lastJobId = entity.value.jobId
    }
  }
  return result
}

const DELETE = 'delete'
const DELETE_ALL = 'delete-all'
const OPEN_IN_NEW_TAB = 'open-in-new-tab'

const ArthasResponseListTab: React.FC<ArthasResponseListProps> = (props) => {
  const isDebugMode =
    useSelector<RootState, boolean | undefined>(
      (state) => state.channel.context.isDebugMode,
    ) ?? false
  const context = useContext(ChannelContext)
  const [filteredResponses, setFilteredResponse] = useState<
    ResponseGroupItem[]
  >(() => buildArray0(context.messageBus))
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(-1)
  const currentRightClickSelectedIndex = useRef(0)

  useEffect(() => {
    const id = context.messageBus.addListener({
      onMessage(messages) {
        setFilteredResponse((prevState) => {
          return [
            ...prevState,
            ...buildArray(
              messages,
              prevState.length > 0
                ? prevState[prevState.length - 1]
                : undefined,
              store.getState().channel.context.isDebugMode,
            ),
          ]
        })
      },
    })
    return () => {
      context.messageBus.removeListener(id)
    }
  }, [context.messageBus])

  useEffect(() => {
    setFilteredResponse(buildArray0(context.messageBus))
  }, [context.messageBus, isDebugMode])

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100

      if (isAtBottom) {
        container.scrollTo({ top: container.scrollHeight })
      }
    }
  }, [filteredResponses])

  const { menuProps, onContextMenu } = useRightClickMenu()

  const menuItems: RightClickMenuItem[] = useMemo(
    () => [
      {
        name: i18n.t('channel.openInNewTab'),
        key: OPEN_IN_NEW_TAB,
        icon: <SvgIcon icon={Icon.EXTERNAL} />,
      },
      {
        name: i18n.t('common.delete'),
        key: DELETE,
        color: 'danger',
        className: 'text-danger',
      },
      {
        name: i18n.t('common.deleteAll'),
        key: DELETE_ALL,
        color: 'danger',
        className: 'text-danger',
        icon: <SvgIcon icon={Icon.TRASH} size={18} />,
      },
    ],
    [],
  )

  const onContextMenu0 = useCallback(
    (e: React.MouseEvent<unknown, MouseEvent>, index: number) => {
      currentRightClickSelectedIndex.current = index
      onContextMenu(e)
    },
    [onContextMenu],
  )

  const onEntitySelect = (index: number) => {
    setSelectedEntityIndex(index)
    const r = filteredResponses[index]
    if (r) {
      props.onEntitySelect(r.entity)
    }
  }

  const onAction = async (k: string | number) => {
    const item = filteredResponses[currentRightClickSelectedIndex.current]
    switch (k) {
      case DELETE_ALL:
        await context.messageBus.clearAllMessage()
        setFilteredResponse([])
        break
      case DELETE:
        await context.messageBus.deleteMessage(item.entity)
        setFilteredResponse(buildArray(context.messageBus.messages))
        break
      case OPEN_IN_NEW_TAB:
        context
          .getTabsController()
          .openTab(
            'MESSAGE_DETAIL',
            { uniqueId: item.entity.id, name: item.entity.context.command },
            { msg: item.entity },
          )
        break
    }
  }

  return (
    <div className="h-full overflow-y-scroll" ref={scrollRef}>
      <div className="text-content text-sm">
        <RightClickMenu {...menuProps} items={menuItems} onAction={onAction} />
        {filteredResponses.map((r, index) => (
          <ArthasResponseItem
            onContextMenu={(e) => onContextMenu0(e, index)}
            index={index}
            isSelected={index === selectedEntityIndex}
            item={r}
            key={index + isDebugMode.toString()}
            onEntitySelect={onEntitySelect}
          />
        ))}
      </div>
    </div>
  )
}

export default ArthasResponseListTab
