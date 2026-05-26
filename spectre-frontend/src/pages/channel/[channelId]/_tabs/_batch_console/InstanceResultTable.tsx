import React, { useMemo } from 'react'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { InstanceInfoVO } from '@/api/impl/arthas.ts'
import { getArthasMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

interface InstanceResultTableProps {
  messages: ArthasMessage[]
  instanceId: string
}

const IGNORED_TYPES = new Set(['input_status', 'command'])

const InstanceResultTable: React.FC<InstanceResultTableProps> = ({
  instanceId,
  messages,
}) => {
  const instances = useSelector<RootState, Record<string, InstanceInfoVO>>(
    (state) => state.channel.context.instances,
  )
  const isDebugMode = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.isDebugMode,
  )
  const filteredMessage = useMemo(() => {
    if (isDebugMode) {
      return messages
    } else {
      return messages.filter((msg) => !IGNORED_TYPES.has(msg.value.type))
    }
  }, [isDebugMode, messages])
  const instanceInfoVO = instances[instanceId]

  return (
    <div>
      <div className="text-primary ml-3">{instanceInfoVO.jvmName}</div>
      <Table
        removeWrapper
        className="mt-4 px-2"
        isStriped
        aria-label="Arthas Result"
      >
        <TableHeader>
          <TableColumn>Tag</TableColumn>
          <TableColumn>结果</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredMessage.map((msg) => {
            const view = getArthasMessageView(msg.value.type)?.display(msg) ?? {
              name: '<Unknown>',
              color: 'primary',
              tag: msg.value.type,
              tabName: 'Unknown',
            }
            return (
              <TableRow key={msg.id}>
                <TableCell className={'text-' + view.color}>
                  {view.tag}
                </TableCell>
                <TableCell>{view.name}</TableCell>
                <TableCell>
                  <Button isIconOnly color="primary" variant="light">
                    <SvgIcon icon={Icon.VIEW} />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default InstanceResultTable
