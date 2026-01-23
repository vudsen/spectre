import { registerMessageView } from '../factory.ts'
import MessageDetail from '../_component/MessageDetail.tsx'

registerMessageView({
  type: 'message',
  display: (message) => ({
    name: message.value.message,
    color: 'secondary',
    tag: '服务器消息',
  }),
  detailComponent: MessageDetail,
})
