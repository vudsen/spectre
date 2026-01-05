import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import TraceMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/TraceMessageDetail.tsx'

registerMessageView({
  type: 'trace',
  detailComponent: TraceMessageDetail,
  display: () => ({
    color: 'default',
    name: `查看链路调用`,
    tag: 'trace',
  }),
})
