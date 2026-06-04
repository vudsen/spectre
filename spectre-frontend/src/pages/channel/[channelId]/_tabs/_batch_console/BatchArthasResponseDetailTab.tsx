import React, { useCallback, useState } from 'react'
import i18n from '@/i18n'
import InstanceResultTable from '@/pages/channel/[channelId]/_tabs/_batch_console/InstanceResultTable.tsx'
import { Divider } from '@heroui/react'
import { type RootState } from '@/store'
import { useSelector } from 'react-redux'
import type { AggregatedCommandGroup } from '@/store/channelSlice.ts'
import ArthasMessageDetailFloatingFrame from '@/pages/channel/[channelId]/_tabs/_batch_console/ArthasMessageDetailFloatingFrame.tsx'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

interface BatchArthasResponseDetailTabProps {
  groupIndex?: number
}

const BatchArthasResponseDetailTab0: React.FC<{
  groupIndex: number
}> = ({ groupIndex }) => {
  const messages = useSelector<RootState, AggregatedCommandGroup[]>(
    (state) => state.channel.context.groupedMessages,
  )
  const group = messages[groupIndex]
  const [targetViewMessage, setTargetViewMessage] = useState<ArthasMessage>()

  const onClose = useCallback(() => {
    setTargetViewMessage(undefined)
  }, [])
  return (
    <div className="h-full overflow-y-scroll">
      <div className="bg-primary-50 text-primary-700 px-6 py-3 text-sm">
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_arthasresponsedetail_002',
        )}{' '}
        {group.command}
      </div>
      <div className="space-y-3 pt-3 pb-20">
        {Object.entries(group.instances).map(([k, v], index) => (
          <React.Fragment key={k + ':' + v.length}>
            {index > 0 ? <Divider /> : null}
            <InstanceResultTable
              messages={v}
              instanceId={k}
              onView={setTargetViewMessage}
            />
          </React.Fragment>
        ))}
      </div>
      <ArthasMessageDetailFloatingFrame
        entity={targetViewMessage}
        onClose={onClose}
      />
    </div>
  )
}

const BatchArthasResponseDetailTab: React.FC<
  BatchArthasResponseDetailTabProps
> = ({ groupIndex }) => {
  if (groupIndex === null || groupIndex === undefined) {
    return (
      <div className="m-3 text-sm select-none">
        <div>
          {i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_001',
          )}
        </div>
        <div className="text-secondary">
          {i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_002',
          )}
        </div>
      </div>
    )
  }
  return <BatchArthasResponseDetailTab0 groupIndex={groupIndex} />
}

export default BatchArthasResponseDetailTab
