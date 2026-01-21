import { registerMessageView } from '../factory.ts'
import MemoryMessageDetail from '../_component/MemoryMessageDetail.tsx'

registerMessageView({
  detailComponent: MemoryMessageDetail,
  display: (_) => ({
    color: 'default',
    name: '查看内存信息',
    tag: 'memory',
  }),
  type: 'memory',
})
