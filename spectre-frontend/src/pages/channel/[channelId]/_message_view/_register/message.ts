import { registerMessageView } from '../factory.ts'
import MessageDetail from '../_component/MessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'message',
  display: (message) => ({
    name: message.value.message,
    color: 'secondary',
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_message_001',
    ),
  }),
  detailComponent: MessageDetail,
})
