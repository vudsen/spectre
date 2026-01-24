import { registerMessageView } from '../factory.ts'
import type { InputStatusResponse } from '@/api/impl/arthas.ts'

// 存放还没完成的

registerMessageView<InputStatusResponse>({
  type: 'input_status',
  display: (message) => ({
    name: message.value.inputStatus,
    tag: '输入状态',
  }),
})
