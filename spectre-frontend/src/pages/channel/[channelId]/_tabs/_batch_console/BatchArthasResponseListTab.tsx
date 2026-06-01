import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useState } from 'react'
import clsx from 'clsx'
import type { AggregatedCommandGroup } from '@/store/channelSlice.ts'

interface BatchArthasResponseListTabProps {
  onSelect: (groupIndex: number) => void
}

const BatchArthasResponseListTab: React.FC<BatchArthasResponseListTabProps> = ({
  onSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const messages = useSelector<RootState, AggregatedCommandGroup[]>(
    (state) => state.channel.context.messages,
  )

  const onSelect0 = (index: number) => {
    setSelectedIndex(index)
    onSelect(index)
  }

  return (
    <div className="h-full overflow-y-scroll">
      <div className="text-content text-sm">
        {messages.map((commandGroup, index) => (
          <div
            key={commandGroup.command + index}
            className={clsx(
              selectedIndex === index
                ? 'odd:bg-blue-50 even:bg-zinc-200'
                : undefined,
              'transition-background cursor-pointer px-3 py-3 select-none even:bg-zinc-100 odd:hover:bg-blue-50 even:hover:bg-zinc-200',
            )}
            onClick={() => onSelect0(index)}
          >
            <div className="text-default-700 ml-2 truncate text-sm">
              {commandGroup.command}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchArthasResponseListTab
