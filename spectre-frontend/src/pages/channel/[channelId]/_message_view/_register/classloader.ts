import { registerMessageView } from '../factory.ts'
import ClassloaderMessageDetail from '../_component/ClassloaderMessageDetail'
import i18n from '@/i18n'

registerMessageView({
  type: 'classloader',
  display: () => ({
    name: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_register_classloader_001',
    ),
    color: 'success',
    tag: i18n.t(
      'hardcoded.msg_pages_channel_param_message_view_component_classloadermessagedetail_001',
    ),
  }),
  detailComponent: ClassloaderMessageDetail,
})
