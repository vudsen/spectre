import { registerMessageView } from '../factory.ts'
import StatusMessageDetail from '../_component/StatusMessageDetail.tsx'

registerMessageView({
  type: 'status',
  detailComponent: StatusMessageDetail,
  display: (message) => ({
    name: message.value.message ?? '成功',
    color: message.value.statusCode === 0 ? 'success' : 'danger',
    tag: message.value.statusCode === 0 ? '执行成功' : '执行失败',
  }),
})
