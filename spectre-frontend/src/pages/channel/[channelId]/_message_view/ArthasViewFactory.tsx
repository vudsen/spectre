import type { ArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'
import CommandMessageDetail from '@/pages/channel/[channelId]/_message_view/CommandMessageDetail.tsx'
import MessageDetail from '@/pages/channel/[channelId]/_message_view/MessageDetail.tsx'
import WelcomeMessageDetail from '@/pages/channel/[channelId]/_message_view/WelcomeMessageDetail.tsx'
import StatusMessageDetail from '@/pages/channel/[channelId]/_message_view/StatusMessageDetail.tsx'
import WatchMessageDetail from '@/pages/channel/[channelId]/_message_view/WatchMessageDetail.tsx'

interface ArthasViewFactoryProps {
  msg?: ArthasResponse
}

const ArthasViewFactory: React.FC<ArthasViewFactoryProps> = (props) => {
  if (!props.msg) {
    return <div>Unsupported</div>
  }
  switch (props.msg.type) {
    case 'command':
      return <CommandMessageDetail msg={props.msg} />
    case 'message':
      return <MessageDetail msg={props.msg} />
    case 'welcome':
      return <WelcomeMessageDetail msg={props.msg} />
    case 'status':
      return <StatusMessageDetail msg={props.msg} />
    case 'watch':
      return <WatchMessageDetail msg={props.msg} />
    default:
      return (
        <div className="italic">
          🚧该消息暂不支持预览，请使用`原始内容`查看。我们正在全力开发中，敬请期待🚧
        </div>
      )
  }
}

export default ArthasViewFactory
