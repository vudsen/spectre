import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import { useSelector } from 'react-redux'
import { type RootState, store } from '@/store'
import ArthasResponseItem, {
  type ResponseGroupItem,
} from '@/pages/channel/[channelId]/_tabs/_console/_component/ArthasResponseItem.tsx'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'

interface ArthasResponseListProps {
  onEntitySelect: (e: ArthasResponseWithId) => void
}

const IGNORED_TYPES = new Set(['input_status'])
function buildArray0() {
  const channelSlice = store.getState().channel
  const isDebugMode = channelSlice.context.isDebugMode
  return buildArray(
    channelSlice.messages[channelSlice.context.channelId] ?? [],
    undefined,
    isDebugMode,
  )
}
function buildArray(
  messages: ArthasResponseWithId[],
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
    let lastJobId = previousMessage?.entity.jobId ?? -1
    let groupColorFlag = previousMessage?.groupInfo?.colorFlag ?? -1
    let lastMsgType = previousMessage ? previousMessage.entity.type : ''
    for (const entity of messages) {
      if (IGNORED_TYPES.has(entity.type)) {
        continue
      }
      // dashboard 仅显示第一条
      if ('dashboard' === entity.type && lastMsgType === entity.type) {
        continue
      }
      lastMsgType = entity.type
      if (entity.jobId === lastJobId) {
        result.push({
          entity,
          groupInfo: {
            colorFlag: groupColorFlag,
          },
        })
      } else {
        groupColorFlag++
        if (groupColorFlag === 2) {
          groupColorFlag = 0
        }
        result.push({
          entity,
          groupInfo: {
            colorFlag: groupColorFlag,
          },
        })
      }
      lastJobId = entity.jobId
    }
  }
  return result
}

const ArthasResponseListTab: React.FC<ArthasResponseListProps> = (props) => {
  const isDebugMode =
    useSelector<RootState, boolean | undefined>(
      (state) => state.channel.context.isDebugMode,
    ) ?? false
  const [filteredResponses, setFilteredResponse] =
    useState<ResponseGroupItem[]>(buildArray0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(-1)
  const context = useContext(ChannelContext)

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
    setFilteredResponse(buildArray0())
  }, [isDebugMode])

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100
      console.log(isAtBottom)

      if (isAtBottom) {
        container.scrollTo({ top: container.scrollHeight })
      }
    }
  }, [filteredResponses])

  const onEntitySelect = (index: number) => {
    setSelectedEntityIndex(index)
    const r = filteredResponses[index]
    if (r) {
      props.onEntitySelect(r.entity)
    }
  }

  return (
    <div className="h-full overflow-y-scroll" ref={scrollRef}>
      <div className="text-content text-sm">
        {filteredResponses.map((r, index) => (
          <ArthasResponseItem
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
