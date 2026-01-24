import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import SmMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/SmMessageDetail.tsx'

registerMessageView({
  detailComponent: SmMessageDetail,
  type: 'sm',
  display: () => ({
    tag: 'sm',
    name: '搜索方法',
  }),
})
