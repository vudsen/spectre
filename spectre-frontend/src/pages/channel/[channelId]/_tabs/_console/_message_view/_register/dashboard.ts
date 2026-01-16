import { registerMessageView } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import DashboardMessageDetail from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/DashboardMessageDetail.tsx'

registerMessageView({
  detailComponent: DashboardMessageDetail,
  type: 'dashboard',
  display: (_) => ({
    name: '服务状态',
    color: 'default',
    tag: 'Dashboard',
  }),
})
