import { registerMessageView } from '../factory.ts'
import type { InputStatusResponse } from '@/api/impl/arthas.ts'
import i18n from '@/i18n'

// 存放还没完成的

registerMessageView<InputStatusResponse>({
  type: 'input_status',
  display: (message) => ({
    name: message.value.inputStatus,
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_uncomplete_001',
    ),
  }),
})
