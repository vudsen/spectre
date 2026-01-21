import { registerMessageView } from '../factory.ts'
import JadMessageDetail from '../_component/JadMessageDetail.tsx'

registerMessageView({
  detailComponent: JadMessageDetail,
  type: 'jad',
  display: (message) => ({
    name: message.classInfo.name,
    tag: 'jad',
    color: 'default',
  }),
})
