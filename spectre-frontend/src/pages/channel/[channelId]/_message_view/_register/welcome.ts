import { registerMessageView } from '../factory.ts'
import WelcomeMessageDetail from '../_component/WelcomeMessageDetail.tsx'

registerMessageView({
  type: 'welcome',
  detailComponent: WelcomeMessageDetail,
  display: (message) => ({
    name: message.mainClass,
    color: 'primary',
    tag: '欢迎信息',
  }),
})
