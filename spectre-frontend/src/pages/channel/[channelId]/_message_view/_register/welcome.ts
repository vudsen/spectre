import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import WelcomeMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/WelcomeMessageDetail.tsx'

registerMessageView({
  type: 'welcome',
  detailComponent: WelcomeMessageDetail,
  display: (message) => ({
    name: message.mainClass,
    color: 'primary',
    tag: '欢迎信息',
  }),
})
