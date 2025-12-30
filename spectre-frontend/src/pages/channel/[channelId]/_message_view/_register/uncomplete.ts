import { registerMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import type { InputStatusResponse } from '@/api/impl/arthas.ts'

// 存放还没完成的

type VersionMessage = {
  type: 'version'
  version: string
  jobId: number
}

type ClassLoaderMessage = {
  type: 'classloader'
  jobId: number
  classLoaderStats: Record<
    string,
    {
      loadedCount: number
      numberOfInstance: number
    }
  >
}

type RowAffectedMessage = {
  type: 'row_affect'
  jobId: number
  rowCount: number
}

registerMessageView<RowAffectedMessage>({
  type: 'row_affect',
  display: (message) => ({
    name: `影响了 ${message.rowCount} 个类`,
    color: 'secondary',
    tag: '影响数量',
  }),
})

registerMessageView<ClassLoaderMessage>({
  type: 'classloader',
  display: () => ({
    name: '列出所有的类加载器',
    color: 'success',
    tag: '类加载器',
  }),
})

registerMessageView<VersionMessage>({
  type: 'version',
  display: (message) => ({
    name: message.version,
    color: 'secondary',
    tag: '服务器消息',
  }),
})

registerMessageView<InputStatusResponse>({
  type: 'input_status',
  display: (message) => ({
    name: message.inputStatus,
    color: 'default',
    tag: '输入状态',
  }),
})
