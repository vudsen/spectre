import React, { useCallback } from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import { Card, CardBody, Code, Link, Tooltip } from '@heroui/react'
import KVGird from '@/components/KVGird'
import KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import { useDispatch } from 'react-redux'
import { updateChannelContext } from '@/store/channelSlice.ts'
import SimpleList from '@/components/SimpleList.tsx'
import i18n from '@/i18n'

type MethodInfo = {
  constructor: boolean
  declaringClass: string
  descriptor: string
  methodName: string
}

type MethodDetail = MethodInfo & {
  annotations: string[]
  classLoaderHash: string
  exceptions: string[]
  modifier: string
  parameters: string[]
  returnType: string
}

type ScMessage = {
  type: 'sc'
  segment: number
  jobId: number
  detail: boolean
  withField: boolean
  methodInfo?: MethodInfo | MethodDetail
}

const SmWithDetail: React.FC<{ detail: MethodDetail }> = ({ detail }) => {
  const dispatch = useDispatch()
  const applyClassloader = useCallback(() => {
    dispatch(
      updateChannelContext({
        classloaderHash: detail.classLoaderHash,
      }),
    )
  }, [detail.classLoaderHash, dispatch])
  return (
    <div>
      <div className="header-1 mb-3 truncate text-ellipsis">
        {detail.declaringClass}#{detail.methodName}
      </div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">
            {i18n.t('hardcoded.msg_ext_view_k8sview_001')}
          </div>
          <KVGird>
            <KVGridItem
              name={i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_smmessagedetail_001',
              )}
            >
              {detail.methodName}
            </KVGridItem>
            <KVGridItem
              name={i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_001',
              )}
            >
              {detail.modifier}
            </KVGridItem>
            <KVGridItem
              name={i18n.t(
                'hardcoded.msg_pages_channel_param_message_view_component_smmessagedetail_002',
              )}
            >
              {detail.returnType}
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
                  #{detail.classLoaderHash}
                </Link>
              </Tooltip>
            </KVGridItem>
          </KVGird>
          <SimpleList
            name={i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_smmessagedetail_003',
            )}
            color="warning"
            entities={detail.parameters}
          />
          <SimpleList
            name={i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_scmessagedetail_003',
            )}
            color="warning"
            entities={detail.annotations}
          />
          <SimpleList
            name="Exceptions"
            color="warning"
            entities={detail.exceptions}
          />
        </CardBody>
      </Card>
    </div>
  )
}

const SmMessageDetail: React.FC<DetailComponentProps<ScMessage>> = ({
  msg,
}) => {
  if (msg.detail) {
    return <SmWithDetail detail={msg.methodInfo as MethodDetail} />
  } else if (msg.methodInfo) {
    return (
      <div className="space-y-3 text-sm">
        <div>
          {i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_component_smmessagedetail_004',
          )}
        </div>
        <Code>{msg.methodInfo.methodName}</Code>
      </div>
    )
  }
}

export default SmMessageDetail
