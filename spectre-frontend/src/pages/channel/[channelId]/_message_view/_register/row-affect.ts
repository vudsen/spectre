import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import RowAffectDetail from '@/pages/channel/[channelId]/_message_view/_component/RowAffectDetail.tsx'
import i18n from '@/i18n'

registerMessageView({
  type: 'row_affect',
  detailComponent: RowAffectDetail,
  display: (message) => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_row_affect_001',
      {
        rowCount: message.value.rowCount,
      },
    ),
    color: 'secondary',
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_row_affect_002',
    ),
  }),
})
