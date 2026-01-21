import { registerMessageView } from '../factory.ts'
import DashboardMessageDetail from '../_component/DashboardMessageDetail.tsx'

registerMessageView({
  detailComponent: DashboardMessageDetail,
  type: 'dashboard',
  display: (_) => ({
    name: '服务状态',
    color: 'default',
    tag: 'Dashboard',
  }),
})
