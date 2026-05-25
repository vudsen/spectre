import { useContext } from 'react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import type { AggregatedCommandGroup } from '@/pages/channel/[channelId]/messageAggregation.ts'

interface BatchArthasResponseListTabProps {
  onSelect: (group: AggregatedCommandGroup) => void
}

const BatchArthasResponseListTab: React.FC<BatchArthasResponseListTabProps> = ({
  onSelect,
}) => {
  const context = useContext(ChannelContext)

  return (
    <div className="h-full overflow-y-scroll">
      <div className="text-content text-sm">
        {context.messageBus.aggregatedMessages.map((commandGroup, index) => (
          <div
            key={commandGroup.command + index}
            className="'cursor-pointer select-none' px-3 py-3"
            onClick={() => onSelect(commandGroup)}
          >
            {commandGroup.command}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchArthasResponseListTab
