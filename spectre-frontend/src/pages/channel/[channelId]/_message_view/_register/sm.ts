import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SmMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SmMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: SmMessageDetail,
  type: 'sm',
  display: () => ({
    tag: 'sm',
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_sm_001',
    ),
  }),
})
