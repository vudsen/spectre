import type { AggregatedCommandGroup } from '@/pages/channel/[channelId]/messageAggregation.ts'
import React from 'react'
import i18n from '@/i18n'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'

interface BatchArthasResponseDetailTabProps {
  group?: AggregatedCommandGroup
}

const BatchArthasResponseDetailTab0: React.FC<{
  group: AggregatedCommandGroup
}> = ({ group }) => {
  return (
    <div>
      <div className="bg-primary-50 text-primary-700 px-6 py-3 text-sm">
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_arthasresponsedetail_002',
        )}{' '}
        {group.command}
      </div>
      {Object.entries(group.instances).map(([k, v]) => (
        <div key={k}>
          <div>{k}</div>
          <Table>
            <TableHeader>
              <TableColumn>Job Id</TableColumn>
              <TableColumn>结果</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody items={v}>
              {(resp) => (
                <TableRow key={resp.id}>
                  <TableCell>{resp.id}</TableCell>
                  <TableCell>{resp.value.type}</TableCell>
                  <TableCell>view</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ))}
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
