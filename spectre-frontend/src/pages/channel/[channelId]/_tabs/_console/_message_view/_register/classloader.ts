import { registerMessageView } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/factory.ts'
import ClassloaderMessageDetail from '../_component/ClassloaderMessageDetail'

registerMessageView({
  type: 'classloader',
  display: () => ({
    name: '列出所有的类加载器',
    color: 'success',
    tag: '类加载器',
  }),
  detailComponent: ClassloaderMessageDetail,
})
