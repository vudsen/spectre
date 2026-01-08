import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import WatchMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/WatchMessageDetail.tsx'

registerMessageView({
  type: 'watch',
  display: (message) => ({
    name: `${message.className}#${message.methodName}`,
    color: 'success',
    tag: 'watch',
  }),
  detailComponent: WatchMessageDetail,
})
