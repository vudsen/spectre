import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import i18n from '@/i18n'

type RowAffectedMessage = {
  type: 'row_affect'
  jobId: number
  rowCount: number
}

const RowAffectDetail: React.FC<DetailComponentProps<RowAffectedMessage>> = (
  props,
) => {
  return (
    <div>
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_rowaffectdetail_001',
      )}{' '}
      {props.msg.rowCount}{' '}
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_rowaffectdetail_002',
      )}
    </div>
  )
}

export default RowAffectDetail
