import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'

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
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_commandmessagedetail_001',
        )}
      </div>
      <Code color="primary">{props.msg.command}</Code>
      {props.msg.state === 'FAILED' ? (
        <>
          <div>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_commandmessagedetail_002',
            )}
          </div>
          <Code color="danger">{props.msg.message}</Code>
        </>
      ) : null}
    </div>
  )
}

export default CommandMessageDetail
