import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import TTMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/TTMessageDetail.tsx'

registerMessageView({
  type: 'tt',
  display: (message) => ({
    name: message.context.command,
  }),
  detailComponent: TTMessageDetail,
})
