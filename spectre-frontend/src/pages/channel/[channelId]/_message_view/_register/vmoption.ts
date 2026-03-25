import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import VmOptionsMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/VmOptionsMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'vmoption',
  detailComponent: VmOptionsMessageDetail,
  display: () => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_vmoption_001',
    ),
  }),
})
