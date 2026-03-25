import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SysPropMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SysPropMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: SysPropMessageDetail,
  display: () => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_sysprop_001',
    ),
  }),
  type: 'sysprop',
})
