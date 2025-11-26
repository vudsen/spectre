import React, { useEffect, useState } from 'react'
import type { ArthasResponse } from '@/api/impl/arthas.ts'
import ArthasResponseDisplay from '@/pages/channel/[channelId]/_message-components/ArthasResponseDisplay.tsx'
import clsx from 'clsx'

interface ArthasResponseListProps {
  isDebugMode: boolean
  responses: ArthasResponse[]
  onEntitySelect: (e: ArthasResponse) => void
}

const IGNORED_TYPES = new Set(['input_status'])

type ResponseGroupItem = {
  entity: ArthasResponse
  groupInfo?: {
    colorFlag: number
  }
}

const ArthasResponseList: React.FC<ArthasResponseListProps> = (props) => {
  const [filteredResponses, setFilteredResponse] = useState<
    ResponseGroupItem[]
  >([])
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(-1)

  useEffect(() => {
    if (props.isDebugMode) {
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
  }, [props.responses, props.isDebugMode])

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
        <div
          key={`${r.entity.type}:${r.entity.jobId}:${index}`}
          className={clsx(
            {
              'border-divider': !r.groupInfo,
              'bg-zinc-100':
                (index & 1) === 0 &&
                index !== selectedEntityIndex &&
                !r.groupInfo,
              'bg-cyan-100': r.groupInfo && r.groupInfo.colorFlag === 0,
              'bg-blue-100': r.groupInfo && r.groupInfo.colorFlag === 1,
              'bg-primary-100': index === selectedEntityIndex,
            },
            'hover:bg-primary-100 cursor-pointer px-3 py-3 select-none',
          )}
          onClick={() => onEntitySelect(index)}
        >
          <ArthasResponseDisplay entity={r.entity} />
        </div>
      ))}
    </div>
  )
}

export default ArthasResponseList
