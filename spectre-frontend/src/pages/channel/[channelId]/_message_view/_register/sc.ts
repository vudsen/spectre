import { registerMessageView } from '../factory.ts'
import ScMessageDetail from '../_component/ScMessageDetail.tsx'

registerMessageView({
  detailComponent: ScMessageDetail,
  type: 'sc',
  display: (_) => ({
    tag: 'sc',
    name: '查找类',
    color: 'default',
  }),
})
