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
        <TableColumn>名称</TableColumn>
        <TableColumn>值</TableColumn>
      </TableHeader>
      <TableBody emptyContent="没有任何标签">
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
