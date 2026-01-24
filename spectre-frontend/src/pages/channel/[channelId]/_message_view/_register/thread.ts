import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import ThreadMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/ThreadMessageDetail.tsx'

registerMessageView({
  detailComponent: ThreadMessageDetail,
  type: 'thread',
  display: () => ({
    name: '线程信息',
  }),
})
