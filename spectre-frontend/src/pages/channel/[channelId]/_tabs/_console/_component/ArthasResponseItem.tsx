import clsx from 'clsx'
import React, { useMemo } from 'react'
import './listStyle.css'
import ArthasResponsePreview from '@/pages/channel/[channelId]/_message_view/ArthasResponsePreview.tsx'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

export type ResponseGroupItem = {
  entity: ArthasMessage
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
          normal: 'groupEven',
          selected: 'evenSelected',
        }
      } else {
        return {
          normal: 'groupOdd',
          selected: 'oddSelected',
        }
      }
    } else {
      if ((index & 1) === 0) {
        return {
          normal: 'groupEven',
          selected: 'evenSelected',
        }
      } else {
        return {
          normal: 'groupOdd',
          selected: 'oddSelected',
        }
      }
    }
  }, [index, item.groupInfo])

  return (
    <div
      key={item.entity.id}
      className={clsx(
        isSelected ? colors.selected : colors.normal,
        'cursor-pointer px-3 py-3 select-none',
      )}
      onClick={() => onEntitySelect(index)}
    >
      <ArthasResponsePreview message={item.entity} />
    </div>
  )
}

export default ArthasResponseItem
