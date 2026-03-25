import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import React from 'react'
import CopyableValue from '@/components/CopyableValue.tsx'
import i18n from '@/i18n'

type SysEnvMessage = {
  env: Record<string, string>
  jobId: number
  type: 'sysenv'
}

const SysEnvMessageDetail: React.FC<DetailComponentProps<SysEnvMessage>> = ({
  msg,
}) => {
  return (
    <Table aria-label="Sys env">
      <TableHeader>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
        </TableColumn>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_005')}
        </TableColumn>
      </TableHeader>
      <TableBody items={Object.entries(msg.env)}>
        {([key, value]) => (
          <TableRow key={key}>
            <TableCell>{key}</TableCell>
            <TableCell>
              <CopyableValue content={value} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default SysEnvMessageDetail
