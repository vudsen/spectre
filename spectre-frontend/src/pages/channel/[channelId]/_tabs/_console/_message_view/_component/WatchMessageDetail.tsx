import type React from 'react'
import type { DetailComponentProps } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import OgnlMessageView from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/_ognl_result/OgnlMessageView.tsx'

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

const WatchMessageDetail: React.FC<DetailComponentProps<WatchMessage>> = ({
  msg,
}) => {
  return (
    <div className="text-sm">
      <OgnlMessageView raw={msg.value} />
    </div>
  )
}

export default WatchMessageDetail
