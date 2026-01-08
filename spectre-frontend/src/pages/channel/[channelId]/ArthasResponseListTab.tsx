import React, { useEffect, useState } from 'react'
import type { ArthasResponse } from '@/api/impl/arthas.ts'
import ArthasResponseItem, {
  type ResponseGroupItem,
} from '@/pages/channel/[channelId]/_component/ArthasResponseItem.tsx'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface ArthasResponseListProps {
  responses: ArthasResponse[]
  onEntitySelect: (e: ArthasResponse) => void
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
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(-1)

  useEffect(() => {
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
        if (entity.jobId === 0) {
          result.push({
            entity,
          })
          lastJobId = entity.jobId
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
  }, [props.responses, isDebugMode])

  const onEntitySelect = (index: number) => {
    setSelectedEntityIndex(index)
    const r = filteredResponses[index]
    if (r) {
      props.onEntitySelect(r.entity)
    }
  }

  return (
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
  )
}

export default ArthasResponseListTab
