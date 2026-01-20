import { registerMessageView } from '../factory.ts'
import WatchMessageDetail from '../_component/WatchMessageDetail.tsx'

registerMessageView({
  type: 'watch',
  display: (message) => ({
    name: `${message.className}#${message.methodName}`,
    color: 'default',
    tag: 'watch',
  }),
  detailComponent: WatchMessageDetail,
})
