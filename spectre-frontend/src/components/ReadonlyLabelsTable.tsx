import i18n from '@/i18n'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'

interface ReadonlyLabelsTableProps {
  labels: Record<string, string>
}

const ReadonlyLabelsTable: React.FC<ReadonlyLabelsTableProps> = (props) => {
  return (
    <Table removeWrapper>
      <TableHeader>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
        </TableColumn>
        <TableColumn>
          {i18n.t('hardcoded.msg_components_labeleditor_index_005')}
        </TableColumn>
      </TableHeader>
      <TableBody
        emptyContent={i18n.t('hardcoded.msg_components_labeleditor_index_006')}
      >
        {Object.entries(props.labels).map(([k, v]) => (
          <TableRow key={k}>
            <TableCell>{k}</TableCell>
            <TableCell>{v}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ReadonlyLabelsTable
