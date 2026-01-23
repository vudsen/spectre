import { registerMessageView } from '../factory.ts'
import StackMessageDetail from '../_component/StackMessageDetail.tsx'

registerMessageView({
  type: 'stack',
  detailComponent: StackMessageDetail,
  display: (message) => ({
    tag: 'stack',
    name: `调用栈(${(message.value.cost / 1024 / 1024).toFixed(4)}ms)`,
    color: 'default',
  }),
})
