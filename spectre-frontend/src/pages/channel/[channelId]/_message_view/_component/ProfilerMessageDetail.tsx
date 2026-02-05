import React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import { Code } from '@heroui/react'

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
      <div>执行结果:</div>
      <Code>{msg.executeResult}</Code>
    </div>
  )
}

export default ProfilerMessageDetail
