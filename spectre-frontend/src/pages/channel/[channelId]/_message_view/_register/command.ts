import { registerMessageView } from '../factory.ts'
import CommandMessageDetail from '../_component/CommandMessageDetail.tsx'

registerMessageView({
  type: 'command',
  display: (entity) => ({
    name: entity.value.command,
    color: 'primary',
    tag: '执行命令',
  }),
  detailComponent: CommandMessageDetail,
})
