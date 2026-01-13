import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import ArthasResponseItem, {
  type ResponseGroupItem,
} from '@/pages/channel/[channelId]/_tabs/_console/_component/ArthasResponseItem.tsx'

interface ArthasResponseListProps {
  responses: ArthasResponseWithId[]
  onEntitySelect: (e: ArthasResponseWithId) => void
}

const IGNORED_TYPES = new Set(['input_status'])

const ArthasResponseListTab: React.FC<ArthasResponseListProps> = (props) => {
  const isDebugMode =
    useSelector<RootState, boolean | undefined>(
      (state) => state.channel.context.isDebugMode,
    ) ?? false
  const [filteredResponses, setFilteredResponse] = useState<
    ResponseGroupItem[]
  >([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(-1)

  useEffect(() => {
    const container = scrollRef.current!
    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 100

    if (isDebugMode) {
      setFilteredResponse(
        props.responses.map((r) => ({
          entity: r,
        })),
      )
    } else {
      let lastJobId = -1
      const result: ResponseGroupItem[] = []
      let groupColorFlag = -1
      for (const entity of props.responses) {
        if (IGNORED_TYPES.has(entity.type)) {
          continue
        }
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
      setFilteredResponse(result)
    }
    if (isAtBottom) {
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }, 200)
    }
  }, [props.responses, isDebugMode])

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
