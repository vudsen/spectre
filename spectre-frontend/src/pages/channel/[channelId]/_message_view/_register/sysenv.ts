import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SysEnvMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SysEnvMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: SysEnvMessageDetail,
  type: 'sysenv',
  display: () => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_sysenv_001',
    ),
  }),
})
