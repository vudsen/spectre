import React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import CopyableValue from '@/components/CopyableValue.tsx'
import i18n from '@/i18n'

type SysPropsMessage = {
  jobId: number
  props: Record<string, string>
  type: 'sysprop'
}
const SysEnvMessageDetail: React.FC<DetailComponentProps<SysPropsMessage>> = ({
  msg,
}) => {
  return (
    <Table aria-label="Sys props">
      <TableHeader>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
        </TableColumn>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_005')}
        </TableColumn>
      </TableHeader>
      <TableBody items={Object.entries(msg.props)}>
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
