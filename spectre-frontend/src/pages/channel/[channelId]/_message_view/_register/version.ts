import VersionMessageDetail, {
  type VersionMessage,
} from '@/pages/channel/[channelId]/_message_view/_component/VersionMessageDetail.tsx'
import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'

registerMessageView<VersionMessage>({
  type: 'version',
  display: (message) => ({
    name: message.value.version,
    color: 'secondary',
    tag: 'version',
  }),
  detailComponent: VersionMessageDetail,
})
