import type React from 'react'
import type { CommandMessage } from '@/api/impl/arthas.ts'
import { Code } from '@heroui/react'

interface CommandMessageDetailProps {
  msg: CommandMessage
}

const CommandMessageDetail: React.FC<CommandMessageDetailProps> = (props) => {
  return (
    <div className="space-y-3 text-sm">
      <div>执行了如下命令:</div>
      <Code color="primary">{props.msg.command}</Code>
      {props.msg.state === 'FAILED' ? (
        <>
          <div>执行失败, 响应为:</div>
          <Code color="danger">{props.msg.message}</Code>
        </>
      ) : null}
    </div>
  )
}

export default CommandMessageDetail
