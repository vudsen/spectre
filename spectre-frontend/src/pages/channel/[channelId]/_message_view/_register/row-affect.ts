import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import RowAffectDetail from '@/pages/channel/[channelId]/_message_view/_component/RowAffectDetail.tsx'

registerMessageView({
  type: 'row_affect',
  detailComponent: RowAffectDetail,
  display: (message) => ({
    name: `影响了 ${message.value.rowCount} 个类`,
    color: 'secondary',
    tag: '影响数量',
  }),
})
