import type { ArthasResponse } from '@/api/impl/arthas.ts'
import clsx from 'clsx'
import ArthasResponseDisplay from './ArthasResponseDisplay.tsx'
import React, { useMemo } from 'react'
import './listStyle.css'

export type ResponseGroupItem = {
  entity: ArthasResponse
  groupInfo?: {
    colorFlag: number
  }
}

interface ArthasResponseItemProps {
  item: ResponseGroupItem
  index: number
  onEntitySelect: (index: number) => void
  isSelected: boolean
}

type MyColors = {
  normal?: string
  selected: string
}

const ArthasResponseItem: React.FC<ArthasResponseItemProps> = ({
  isSelected,
  index,
  item,
  onEntitySelect,
}) => {
  const colors = useMemo<MyColors>(() => {
    if (item.groupInfo) {
      if (item.groupInfo.colorFlag === 0) {
        return {
          normal: 'normalColorFlag0',
          selected: 'normalColorFlag0Selected',
        }
      } else {
        return {
          normal: 'normalColorFlag1',
          selected: 'normalColorFlag1Selected',
        }
      }
    } else {
      if ((index & 1) === 0) {
        return {
          normal: 'normalUngrouped0',
          selected: 'normalUngrouped0Selected',
        }
      } else {
        return {
          normal: 'normalUngrouped1',
          selected: 'normalUngrouped1Selected',
        }
      }
    }
  }, [index, item.groupInfo])

  return (
    <div
      key={`${item.entity.type}:${item.entity.jobId}:${index}`}
      className={clsx(
        isSelected ? colors.selected : colors.normal,
        'cursor-pointer px-3 py-3 select-none',
      )}
      onClick={() => onEntitySelect(index)}
    >
      <ArthasResponseDisplay entity={item.entity} />
    </div>
  )
}

export default ArthasResponseItem
