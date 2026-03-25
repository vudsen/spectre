import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'

type EnhancerMessage = {
  effect: {
    classCount: number
    cost: number
    listenerId: number
    methodCount: 1
  }
  jobId: number
  success: boolean
  type: 'enhancer'
}

const EnhancerMessageDetail: React.FC<DetailComponentProps<EnhancerMessage>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div className="font-bold">
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_enhancermessagedetail_001',
        )}
      </div>
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_enhancermessagedetail_002',
        )}{' '}
        <Code>{props.msg.effect.classCount}</Code>
      </div>
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_enhancermessagedetail_003',
        )}{' '}
        <Code>{props.msg.effect.methodCount}</Code>
      </div>
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_enhancermessagedetail_004',
        )}{' '}
        <Code>{props.msg.effect.cost}ms</Code>
      </div>
    </div>
  )
}

export default EnhancerMessageDetail
