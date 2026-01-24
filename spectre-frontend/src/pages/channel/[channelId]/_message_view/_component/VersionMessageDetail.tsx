import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'

export type VersionMessage = {
  type: 'version'
  version: string
  jobId: number
  fid: number
}

const VersionMessageDetail: React.FC<DetailComponentProps<VersionMessage>> = ({
  msg,
}) => {
  return <div className="text-primary">当前版本: {msg.version}</div>
}

export default VersionMessageDetail
