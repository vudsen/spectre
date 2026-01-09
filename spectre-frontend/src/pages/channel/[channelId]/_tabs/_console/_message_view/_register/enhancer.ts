import { registerMessageView } from '../factory.ts'
import EnhancerMessageDetail from '../_component/EnhancerMessageDetail.tsx'

registerMessageView({
  type: 'enhancer',
  detailComponent: EnhancerMessageDetail,
  display: (message) => ({
    name: `影响了 ${message.effect.classCount} 个类，${message.effect.methodCount} 个方法 (${message.effect.cost}ms)`,
    color: 'secondary',
    tag: 'Enhancer',
  }),
})
