import i18n from '@/i18n'
import { registerMessageView } from '../factory.ts'
import StackMessageDetail from '../_component/StackMessageDetail.tsx'

registerMessageView({
  type: 'stack',
  detailComponent: StackMessageDetail,
  display: (message) => ({
    tag: 'stack',
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_stack_001',
      {
        cost: (message.value.cost / 1024 / 1024).toFixed(4),
      },
    ),
    color: 'default',
  }),
})
