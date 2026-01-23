import ArthasResponseDetail from '@/pages/channel/[channelId]/_message_view/ArthasResponseDetail.tsx'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

export interface MessageDetailPageProps {
  msg: ArthasMessage
}

const MessageDetailPage: React.FC<MessageDetailPageProps> = (props) => {
  return (
    <div className="p-3">
      <ArthasResponseDetail message={props.msg} />
    </div>
  )
}

export default MessageDetailPage
