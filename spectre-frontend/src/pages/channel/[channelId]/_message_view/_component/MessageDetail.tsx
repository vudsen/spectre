import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'

type MessageResponse = {
  type: 'message'
  jobId: number
  message: string
}

const MessageDetail: React.FC<DetailComponentProps<MessageResponse>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_messagedetail_001',
        )}
      </div>
      <Code>{props.msg.message}</Code>
    </div>
  )
}

export default MessageDetail
