import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'

type MessageResponse = {
  type: 'message'
  jobId: number
  message: string
  fid: number
}

const MessageDetail: React.FC<DetailComponentProps<MessageResponse>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div>服务返回了消息:</div>
      <Code>{props.msg.message}</Code>
    </div>
  )
}

export default MessageDetail
