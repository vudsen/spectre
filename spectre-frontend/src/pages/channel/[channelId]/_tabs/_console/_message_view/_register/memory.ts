import { registerMessageView } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import MemoryMessageDetail from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/MemoryMessageDetail.tsx'

registerMessageView({
  detailComponent: MemoryMessageDetail,
  display: (_) => ({
    color: 'default',
    name: '查看内存信息',
    tag: 'memory',
  }),
  type: 'memory',
})
