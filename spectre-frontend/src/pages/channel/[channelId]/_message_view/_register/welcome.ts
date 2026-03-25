import { registerMessageView } from '../factory.ts'
import WelcomeMessageDetail from '../_component/WelcomeMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'welcome',
  detailComponent: WelcomeMessageDetail,
  display: (message) => ({
    name: message.value.mainClass,
    color: 'primary',
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_welcome_001',
    ),
  }),
})
