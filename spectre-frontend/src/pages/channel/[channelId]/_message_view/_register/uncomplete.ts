import { registerMessageView } from '../factory.ts'
import type { InputStatusResponse } from '@/api/impl/arthas.ts'

// 存放还没完成的

type VersionMessage = {
  type: 'version'
  version: string
  jobId: number
  fid: number
}

type RowAffectedMessage = {
  type: 'row_affect'
  jobId: number
  rowCount: number
  fid: number
}

registerMessageView<RowAffectedMessage>({
  type: 'row_affect',
  display: (message) => ({
    name: `影响了 ${message.value.rowCount} 个类`,
    color: 'secondary',
    tag: '影响数量',
  }),
})

registerMessageView<VersionMessage>({
  type: 'version',
  display: (message) => ({
    name: message.value.version,
    color: 'secondary',
    tag: 'version',
  }),
})

registerMessageView<InputStatusResponse>({
  type: 'input_status',
  display: (message) => ({
    name: message.value.inputStatus,
    tag: '输入状态',
  }),
})
