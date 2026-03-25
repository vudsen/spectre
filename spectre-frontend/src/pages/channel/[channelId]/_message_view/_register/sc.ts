import { registerMessageView } from '../factory.ts'
import ScMessageDetail from '../_component/ScMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: ScMessageDetail,
  type: 'sc',
  display: (_) => ({
    tag: 'sc',
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_sc_001',
    ),
    color: 'default',
  }),
})
