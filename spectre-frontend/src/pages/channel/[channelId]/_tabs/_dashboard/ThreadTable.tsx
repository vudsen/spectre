import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import PercentageData from '@/pages/channel/[channelId]/_tabs/_dashboard/PercentageData.tsx'
import React from 'react'
import type { DashboardMessage } from '@/pages/channel/[channelId]/_message_view/_component/DashboardMessageDetail.tsx'

interface ThreadTableProps {
  threads: DashboardMessage['threads']
}

const ThreadTable: React.FC<ThreadTableProps> = ({ threads }) => {
  return (
    <Table aria-label="Threads">
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>名称</TableColumn>
        <TableColumn>CPU</TableColumn>
        <TableColumn>优先级</TableColumn>
        <TableColumn>状态</TableColumn>
        <TableColumn>中断</TableColumn>
        <TableColumn>组</TableColumn>
      </TableHeader>
      <TableBody items={threads}>
        {(thread) => (
          <TableRow key={thread.id}>
            <TableCell>{thread.id}</TableCell>
            <TableCell>{thread.name}</TableCell>
            <TableCell>
              <PercentageData rate={thread.cpu} />
            </TableCell>
            <TableCell>{thread.priority}</TableCell>
            <TableCell>{thread.state}</TableCell>
            <TableCell>{thread.interrupted.toString()}</TableCell>
            <TableCell>{thread.group}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default ThreadTable
