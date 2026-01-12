import { registerMessageView } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import JadMessageDetail from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/JadMessageDetail.tsx'

registerMessageView({
  detailComponent: JadMessageDetail,
  type: 'jad',
  display: (message) => ({
    name: message.classInfo.name,
    tag: 'jad',
    color: 'default',
  }),
})
