import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import i18n from '@/i18n'

export type VersionMessage = {
  type: 'version'
  version: string
  jobId: number
  fid: number
}

const VersionMessageDetail: React.FC<DetailComponentProps<VersionMessage>> = ({
  msg,
}) => {
  return (
    <div className="text-primary">
      {i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_versionmessagedetail_001',
      )}{' '}
      {msg.version}
    </div>
  )
}

export default VersionMessageDetail
