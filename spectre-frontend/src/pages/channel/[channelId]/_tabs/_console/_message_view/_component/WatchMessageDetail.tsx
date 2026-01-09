import { Code } from '@heroui/react'
import type React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'

type WatchMessage = {
  type: 'watch'
  jobId: number
  accessPoint: string
  className: string
  cost: number
  methodName: string
  sizeLimit: number
  ts: string
  value: string
  fid: number
}

// TODO 解析字符串，构建一颗树形结构
const WatchMessageDetail: React.FC<DetailComponentProps<WatchMessage>> = ({
  msg,
}) => {
  return (
    <div className="space-y-3 text-sm">
      <div>Watch 命令结果: </div>
      <Code className="w-full whitespace-pre-wrap">{msg.value}</Code>
    </div>
  )
}

export default WatchMessageDetail
