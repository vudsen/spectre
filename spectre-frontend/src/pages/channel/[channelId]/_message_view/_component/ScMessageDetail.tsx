import React, { useCallback } from 'react'
import type { DetailComponentProps } from '../factory.ts'
import {
  Card,
  CardBody,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react'
import { updateChannelContext } from '@/store/channelSlice.ts'
import { useDispatch } from 'react-redux'
import KVGird from '@/components/KVGird'
import KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import SimpleList from '@/components/SimpleList.tsx'
import i18n from '@/i18n'

type Fields = {
  annotations: string[]
  modifier: string
  name: string
  static: boolean
  type: string
}

type ClassInfo = {
  annotation: boolean
  annotations: string[]
  anonymousClass: boolean
  array: boolean
  classInfo: string
  classLoaderHash: string
  classloader: string[]
  codeSource: string
  enum: boolean
  fields?: Fields[]
  interface: boolean
  interfaces: string[]
  localClass: boolean
  memberClass: boolean
  modifier: string
  name: string
  primitive: boolean
  simpleName: string
  superClass: string[]
  synthetic: boolean
}
type ScMessage = {
  withField: boolean
  type: 'sc'
  segment: number
  jobId: number
  detailed: boolean
  classNames?: string[]
  classInfo?: ClassInfo
}

const ClassInfoDisplay: React.FC<{ classInfo: ClassInfo }> = ({
  classInfo,
}) => {
  const dispatch = useDispatch()
  // context.messageBus.
  const applyClassloader = useCallback(() => {
    dispatch(
      updateChannelContext({
        classloaderHash: classInfo.classLoaderHash,
      }),
    )
  }, [classInfo.classLoaderHash, dispatch])

  let type: string
  if (classInfo.interface) {
    type = 'Interface'
  } else if (classInfo.enum) {
    type = 'Enum'
  } else if (classInfo.annotation) {
    type = 'Annotation'
  } else if (classInfo.anonymousClass) {
    type = 'Anonymous Class'
  } else if (classInfo.array) {
    type = 'Array'
  } else if (classInfo.localClass) {
    type = 'Local Class'
  } else if (classInfo.memberClass) {
    type = 'Member Class'
  } else {
    type = 'Class'
  }

  return (
    <div className="space-y-3">
      <div className="header-1">{classInfo.name}</div>
      <Card>
        <CardBody className="space-y-3 text-sm">
          <div className="header-2">{i18n.t('common.detail')}</div>
          <KVGird>
            <KVGridItem
              name={i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_001',
              )}
            >
              {classInfo.modifier}
            </KVGridItem>
            <KVGridItem name={i18n.t('hardcoded.msg_ext_view_k8sview_003')}>
              {type}
            </KVGridItem>
            <KVGridItem name="Classloader Hash">
              <Tooltip
                content={i18n.t(
                  'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_002',
                )}
                placement="bottom"
              >
                <Link
                  size="sm"
                  onPress={applyClassloader}
                  className="cursor-pointer"
                  underline="always"
                >
                  #{classInfo.classLoaderHash}
                </Link>
              </Tooltip>
            </KVGridItem>
          </KVGird>
          <SimpleList
            name={i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_003',
            )}
            color="warning"
            entities={classInfo.annotations}
          />
          <SimpleList
            name={i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_004',
            )}
            color="primary"
            entities={classInfo.interfaces}
          />
          <SimpleList name="Classloader" entities={classInfo.classloader} />
          {classInfo.fields ? (
            <>
              <div className="header-2">
                {i18n.t(
                  'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_005',
                )}
              </div>
              <Table removeWrapper>
                <TableHeader>
                  <TableColumn>
                    {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
                  </TableColumn>
                  <TableColumn>
                    {i18n.t('hardcoded.msg_ext_view_k8sview_003')}
                  </TableColumn>
                  <TableColumn>
                    {i18n.t(
                      'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_006',
                    )}
                  </TableColumn>
                  <TableColumn>
                    {i18n.t(
                      'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_001',
                    )}
                  </TableColumn>
                </TableHeader>
                <TableBody items={classInfo.fields}>
                  {(field) => (
                    <TableRow key={field.name}>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell>{field.static.toString()}</TableCell>
                      <TableCell>{field.modifier}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}

const ScMessageDetail: React.FC<DetailComponentProps<ScMessage>> = ({
  msg,
}) => {
  if (msg.classNames) {
    return (
      <SimpleList
        name={i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_007',
        )}
        entities={msg.classNames}
      />
    )
  } else if (msg.classInfo) {
    return <ClassInfoDisplay classInfo={msg.classInfo} />
  }
}

export default ScMessageDetail
