import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import React, { useMemo } from 'react'
import type { DetailComponentProps } from '../factory.ts'
import PercentageData from '@/pages/channel/[channelId]/_tabs/_dashboard/PercentageData.tsx'

type MemoryInfo = {
  max: number
  name: string
  total: number
  type: string
  used: number
}
type MemoryMessage = {
  jobId: number
  memoryInfo: Record<string, MemoryInfo[]>
  type: 'memory'
  fid: number
}
const MemoryMessageDetail: React.FC<DetailComponentProps<MemoryMessage>> = ({
  msg,
}) => {
  const infos = useMemo(() => {
    const infos: MemoryInfo[] = []
    console.log(msg.memoryInfo)
    for (const entry of Object.entries(msg.memoryInfo)) {
      infos.push(...entry[1])
    }
    return infos
  }, [msg.fid])
  return (
    <Table>
      <TableHeader>
        <TableColumn>名称</TableColumn>
        <TableColumn>类型</TableColumn>
        <TableColumn>总大小</TableColumn>
        <TableColumn>使用量</TableColumn>
        <TableColumn>最大</TableColumn>
      </TableHeader>
      <TableBody items={infos}>
        {(info) => (
          <TableRow key={info.name}>
            <TableCell>{info.name}</TableCell>
            <TableCell>{info.type}</TableCell>
            <TableCell>{(info.total / 1024 / 1024).toFixed(0)}MB</TableCell>
            <TableCell>
              {(info.used / 1024 / 1024).toFixed(0)}MB (
              <PercentageData rate={info.used / info.total} />)
            </TableCell>
            <TableCell>
              {info.max < 0 ? (
                <span className="italic">unlimited</span>
              ) : (
                `${(info.max / 1024 / 1024).toFixed(0)}MB`
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default MemoryMessageDetail
