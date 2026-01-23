import { registerMessageView } from '../factory.ts'
import EnhancerMessageDetail from '../_component/EnhancerMessageDetail.tsx'

registerMessageView({
  type: 'enhancer',
  detailComponent: EnhancerMessageDetail,
  display: (message) => ({
    name: `影响了 ${message.value.effect.classCount} 个类，${message.value.effect.methodCount} 个方法 (${message.value.effect.cost}ms)`,
    color: 'secondary',
    tag: 'Enhancer',
  }),
})
