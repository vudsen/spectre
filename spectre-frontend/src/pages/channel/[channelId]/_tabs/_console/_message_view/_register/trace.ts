import { registerMessageView } from '../factory.ts'
import TraceMessageDetail from '../_component/TraceMessageDetail.tsx'

registerMessageView({
  type: 'trace',
  detailComponent: TraceMessageDetail,
  display: () => ({
    color: 'default',
    name: `查看链路调用`,
    tag: 'trace',
  }),
})
