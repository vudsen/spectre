import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SysEnvMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SysEnvMessageDetail.tsx'

registerMessageView({
  detailComponent: SysEnvMessageDetail,
  type: 'sysenv',
  display: () => ({
    name: '环境变量',
  }),
})
