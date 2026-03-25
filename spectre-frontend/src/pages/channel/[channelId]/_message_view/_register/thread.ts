import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import ThreadMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/ThreadMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: ThreadMessageDetail,
  type: 'thread',
  display: () => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_thread_001',
    ),
  }),
})
