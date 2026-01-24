import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SysPropMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SysPropMessageDetail.tsx'

registerMessageView({
  detailComponent: SysPropMessageDetail,
  display: () => ({
    name: '系统参数',
  }),
  type: 'sysprop',
})
