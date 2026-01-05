import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import StackMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/StackMessageDetail.tsx'

registerMessageView({
  type: 'stack',
  detailComponent: StackMessageDetail,
  display: (message) => ({
    tag: 'stack',
    name: `调用栈(${(message.cost / 1024 / 1024).toFixed(4)}ms)`,
    color: 'default',
  }),
})
