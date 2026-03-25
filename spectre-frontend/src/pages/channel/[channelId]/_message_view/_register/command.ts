import { registerMessageView } from '../factory.ts'
import CommandMessageDetail from '../_component/CommandMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'command',
  display: (entity) => ({
    name: entity.value.command,
    color: 'primary',
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_component_statusmessagedetail_001',
    ),
  }),
  detailComponent: CommandMessageDetail,
})
