import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'

type RowAffectedMessage = {
  type: 'row_affect'
  jobId: number
  rowCount: number
}

const RowAffectDetail: React.FC<DetailComponentProps<RowAffectedMessage>> = (
  props,
) => {
  return <div>影响了 {props.msg.rowCount} 个类</div>
}

export default RowAffectDetail
