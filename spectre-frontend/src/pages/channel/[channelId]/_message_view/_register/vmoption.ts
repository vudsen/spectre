import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import VmOptionsMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/VmOptionsMessageDetail.tsx'

registerMessageView({
  type: 'vmoption',
  detailComponent: VmOptionsMessageDetail,
  display: () => ({
    name: '虚拟机选项',
  }),
})
