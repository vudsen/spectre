import { registerMessageView } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import ScMessageDetail from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/ScMessageDetail.tsx'

registerMessageView({
  detailComponent: ScMessageDetail,
  type: 'sc',
  display: (_) => ({
    tag: 'sc',
    name: '查找类',
    color: 'default',
  }),
})
