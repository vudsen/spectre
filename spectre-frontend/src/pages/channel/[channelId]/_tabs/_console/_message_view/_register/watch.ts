import { registerMessageView } from '../factory.ts'
import WatchMessageDetail from '../_component/WatchMessageDetail.tsx'

registerMessageView({
  type: 'watch',
  display: (message) => ({
    name: `${message.className}#${message.methodName}`,
    color: 'success',
    tag: 'watch',
  }),
  detailComponent: WatchMessageDetail,
})
