import { registerMessageView } from '../factory.ts'
import TraceMessageDetail from '../_component/TraceMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'trace',
  detailComponent: TraceMessageDetail,
  display: () => ({
    color: 'default',
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_trace_001',
    ),
    tag: 'trace',
  }),
})
