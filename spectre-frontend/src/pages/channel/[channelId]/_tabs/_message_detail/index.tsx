import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import ArthasResponseDetail from '@/pages/channel/[channelId]/_message_view/ArthasResponseDetail.tsx'

export interface MessageDetailPageProps {
  msg: ArthasResponseWithId
}

const MessageDetailPage: React.FC<MessageDetailPageProps> = (props) => {
  return (
    <div className="p-3">
      <ArthasResponseDetail message={props.msg} />
    </div>
  )
}

export default MessageDetailPage
