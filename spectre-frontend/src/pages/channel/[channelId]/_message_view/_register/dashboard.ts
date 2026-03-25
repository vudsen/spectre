import { registerMessageView } from '../factory.ts'
import DashboardMessageDetail from '../_component/DashboardMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: DashboardMessageDetail,
  type: 'dashboard',
  display: (_) => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_dashboard_001',
    ),
    color: 'default',
    tag: 'Dashboard',
  }),
})
