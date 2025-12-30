import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import EnhancerMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/EnhancerMessageDetail.tsx'

registerMessageView({
  type: 'enhancer',
  detailComponent: EnhancerMessageDetail,
  display: (message) => ({
    name: `影响了 ${message.effect.classCount} 个类，${message.effect.methodCount} 个方法 (${message.effect.cost}ms)`,
    color: 'secondary',
    tag: 'Enhancer',
  }),
})
