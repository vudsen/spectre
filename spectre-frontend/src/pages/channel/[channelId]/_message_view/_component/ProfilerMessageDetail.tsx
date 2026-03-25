import React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import { Code } from '@heroui/react'
import i18n from '@/i18n'

export type ProfilerMessage = {
  action: string
  executeResult: string
  jobId: number
  type: 'profiler'
}

const ProfilerMessageDetail: React.FC<
  DetailComponentProps<ProfilerMessage>
> = ({ msg }) => {
  return (
    <div className="space-y-3">
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_profilermessagedetail_001',
        )}
      </div>
      <Code>{msg.executeResult}</Code>
    </div>
  )
}

export default ProfilerMessageDetail
