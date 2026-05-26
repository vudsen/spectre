import type { AggregatedCommandGroup } from '@/pages/channel/[channelId]/messageAggregation.ts'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface BatchArthasResponseListTabProps {
  onSelect: (group: AggregatedCommandGroup) => void
}

const BatchArthasResponseListTab: React.FC<BatchArthasResponseListTabProps> = ({
  onSelect,
}) => {
  const messages = useSelector<RootState, AggregatedCommandGroup[]>(
    (state) => state.channel.context.messages,
  )

  return (
    <div className="h-full overflow-y-scroll">
      <div className="text-content text-sm">
        {messages.map((commandGroup, index) => (
          <div
            key={commandGroup.command + index}
            className="transition-background cursor-pointer px-3 py-3 select-none even:bg-zinc-100 odd:hover:bg-blue-50 even:hover:bg-zinc-200"
            onClick={() => onSelect(commandGroup)}
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
