import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import CommandMessageDetail from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'

registerMessageView({
  type: 'command',
  display: (entity) => ({
    name: entity.command,
    color: 'primary',
    tag: '执行命令',
  }),
  detailComponent: CommandMessageDetail,
})
