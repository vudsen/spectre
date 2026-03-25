import { registerMessageView } from '../factory.ts'
import MemoryMessageDetail from '../_component/MemoryMessageDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  detailComponent: MemoryMessageDetail,
  display: (_) => ({
    color: 'default',
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_memory_001',
    ),
    tag: 'memory',
  }),
  type: 'memory',
})
