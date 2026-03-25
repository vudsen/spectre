import { registerMessageView } from '../factory.ts'
import StatusMessageDetail from '../_component/StatusMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'status',
  detailComponent: StatusMessageDetail,
  display: (message) => ({
    name:
      message.value.message ?? i18n.t('hardcoded.msg_pages_audit_index_002'),
    color: message.value.statusCode === 0 ? 'success' : 'danger',
    tag:
      message.value.statusCode === 0
        ? i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_register_status_001',
          )
        : i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_register_status_002',
          ),
  }),
})
