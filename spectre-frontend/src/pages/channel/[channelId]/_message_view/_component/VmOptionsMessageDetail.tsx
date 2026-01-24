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

type VmOption = {
  name: string
  origin: string
  value: string
  writeable: boolean
}
type VmOptionsMessage = {
  jobId: number
  type: 'vmoption'
  vmOptions: VmOption[]
}

const VmOptionsMessageDetail: React.FC<
  DetailComponentProps<VmOptionsMessage>
> = ({ msg }) => {
  return (
    <Table>
      <TableHeader>
        <TableColumn>name</TableColumn>
        <TableColumn>value</TableColumn>
        <TableColumn>writeable</TableColumn>
      </TableHeader>
      <TableBody>
        {msg.vmOptions.map((vmOption) => (
          <TableRow key={vmOption.name}>
            <TableCell>{vmOption.name}</TableCell>
            <TableCell>
              <CopyableValue content={vmOption.value} />
            </TableCell>
            <TableCell>{vmOption.writeable.toString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default VmOptionsMessageDetail
