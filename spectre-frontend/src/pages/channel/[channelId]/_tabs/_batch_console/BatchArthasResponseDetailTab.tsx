import type { AggregatedCommandGroup } from '@/pages/channel/[channelId]/messageAggregation.ts'
import React from 'react'
import i18n from '@/i18n'
import InstanceResultTable from '@/pages/channel/[channelId]/_tabs/_batch_console/InstanceResultTable.tsx'
import { Divider } from '@heroui/react'

interface BatchArthasResponseDetailTabProps {
  group?: AggregatedCommandGroup
}

const BatchArthasResponseDetailTab0: React.FC<{
  group: AggregatedCommandGroup
}> = ({ group }) => {
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
          <React.Fragment key={k}>
            {index > 0 ? <Divider /> : null}
            <InstanceResultTable messages={v} instanceId={k} />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

const BatchArthasResponseDetailTab: React.FC<
  BatchArthasResponseDetailTabProps
> = ({ group }) => {
  if (group == null) {
    return <div>点击右侧消息</div>
  }
  return <BatchArthasResponseDetailTab0 group={group} />
}

export default BatchArthasResponseDetailTab
