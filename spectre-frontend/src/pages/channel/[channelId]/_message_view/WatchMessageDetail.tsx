import type { WatchMessage } from '@/api/impl/arthas.ts'
import { Code } from '@heroui/react'
import type React from 'react'

interface CommandMessageDetailProps {
  msg: WatchMessage
}

// TODO 解析字符串，构建一颗树形结构
const WatchMessageDetail: React.FC<CommandMessageDetailProps> = ({ msg }) => {
  return (
    <div className="space-y-3 text-sm">
      <div>Watch 命令结果: </div>
      <Code className="w-full whitespace-pre-wrap">{msg.value}</Code>
    </div>
  )
}

export default WatchMessageDetail
