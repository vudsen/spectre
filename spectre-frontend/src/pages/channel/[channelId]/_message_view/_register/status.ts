import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import StatusMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/StatusMessageDetail.tsx'

registerMessageView({
  type: 'status',
  detailComponent: StatusMessageDetail,
  display: (message) => ({
    name: message.message ?? '成功',
    color: message.statusCode === 0 ? 'success' : 'danger',
    tag: message.statusCode === 0 ? '执行成功' : '执行失败',
  }),
})
