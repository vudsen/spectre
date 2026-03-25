import i18n from '@/i18n'
import { registerMessageView } from '../factory.ts'
import EnhancerMessageDetail from '../_component/EnhancerMessageDetail.tsx'

registerMessageView({
  type: 'enhancer',
  detailComponent: EnhancerMessageDetail,
  display: (message) => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_enhancer_001',
      {
        classCount: message.value.effect.classCount,
        methodCount: message.value.effect.methodCount,
        cost: message.value.effect.cost,
      },
    ),
    color: 'secondary',
    tag: 'Enhancer',
  }),
})
