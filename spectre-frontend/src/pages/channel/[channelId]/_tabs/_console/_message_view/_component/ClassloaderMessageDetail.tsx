import type React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'

type Classloader = {
  hash: string
  loadedCount: number
  name: string
  parent: string
}

export type ClassLoaderMessage = {
  type: 'classloader'
  jobId: number
  fid: number
  classLoaderStats?: Record<
    string,
    {
      loadedCount: number
      numberOfInstance: number
    }
  >
  classLoaders?: Classloader[]
}

const ClassloaderMessageDetail: React.FC<
  DetailComponentProps<ClassLoaderMessage>
> = (props) => {
  if (props.msg.classLoaderStats) {
    return (
      <Table aria-label="Classloaders" removeWrapper>
        <TableHeader>
          <TableColumn>类加载器</TableColumn>
          <TableColumn>加载数量</TableColumn>
          <TableColumn>实例数量</TableColumn>
        </TableHeader>
        <TableBody items={Object.entries(props.msg.classLoaderStats)}>
          {(item) => (
            <TableRow key={item[0]}>
              <TableCell>{item[0]}</TableCell>
              <TableCell>{item[1].loadedCount}</TableCell>
              <TableCell>{item[1].numberOfInstance}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  } else if (props.msg.classLoaders) {
    return (
      <Table aria-label="Classloaders" removeWrapper>
        <TableHeader>
          <TableColumn>类加载器</TableColumn>
          <TableColumn>Hash</TableColumn>
          <TableColumn>加载数量</TableColumn>
          {/*<TableColumn>父加载器</TableColumn>*/}
        </TableHeader>
        <TableBody items={props.msg.classLoaders}>
          {(item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.hash}</TableCell>
              <TableCell>{item.loadedCount}</TableCell>
              {/*<TableCell>{item.parent}</TableCell>*/}
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }
  return (
    <div>
      目前仅支持展示 <code>classloader</code>或<code>classloader -l</code>的响应
    </div>
  )
}

export default ClassloaderMessageDetail
