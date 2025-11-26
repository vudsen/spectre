import type { MessageResponse } from '@/api/impl/arthas.ts'
import type React from 'react'
import { Code } from '@heroui/react'

interface CommandMessageDetailProps {
  msg: MessageResponse
}

const MessageDetail: React.FC<CommandMessageDetailProps> = (props) => {
  return (
    <div className="space-y-3 text-sm">
      <div>服务返回了消息:</div>
      <Code>{props.msg.message}</Code>
    </div>
  )
}

export default MessageDetail
