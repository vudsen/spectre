import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'

export type CommandMessage = {
  type: 'command'
  jobId: number
  state: string
  command: string
  message?: string
}

const CommandMessageDetail: React.FC<DetailComponentProps<CommandMessage>> = (
  props,
) => {
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
