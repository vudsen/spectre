import type React from 'react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'
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
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_001',
            )}
          </TableColumn>
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_002',
            )}
          </TableColumn>
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_003',
            )}
          </TableColumn>
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
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_001',
            )}
          </TableColumn>
          <TableColumn>Hash</TableColumn>
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_002',
            )}
          </TableColumn>
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
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_004',
      )}{' '}
      <code>classloader</code>
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_005',
      )}
      <code>classloader -l</code>
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_006',
      )}
    </div>
  )
}

export default ClassloaderMessageDetail
