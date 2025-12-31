import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import MessageDetail from '@/pages/channel/[channelId]/_message_view/_component/MessageDetail.tsx'

registerMessageView({
  type: 'message',
  display: (message) => ({
    name: message.message,
    color: 'secondary',
    tag: '服务器消息',
  }),
  detailComponent: MessageDetail,
})
