import { createContext } from 'react'
import type { JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import type { Tour } from 'shepherd.js'

export type NodeTreeContext = {
  nodeId: string
  onSelectionChange: () => void
  subScribeSelectionChangeOnce: (cb: () => void) => number
  requireAttach: (searchNode: JvmTreeNodeDTO) => void
  onSearchContentChange: (content: string) => void
  subscribeSearchContentChange: (cb: (content: string) => void) => number
  unsubscribeSearchContentChange: (id: number) => void
  tour?: Tour
}

const TreeContext = createContext<NodeTreeContext>({
  nodeId: '-1',
  onSelectionChange: () => {},
  subScribeSelectionChangeOnce: () => {
    return -1
  },
  requireAttach: () => {},
  onSearchContentChange: () => {},
  subscribeSearchContentChange: () => {
    return -1
  },
  unsubscribeSearchContentChange: () => {},
})

export default TreeContext
