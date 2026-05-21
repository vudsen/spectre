import { createContext } from 'react'
import type { JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import type { Tour } from 'shepherd.js'

export type NodeTreeContext = {
  nodeId: string
  requireAttach: (searchNode: JvmTreeNodeDTO) => void
  tour?: Tour
}

const TreeContext = createContext<NodeTreeContext>({
  nodeId: '-1',
  requireAttach: () => {},
})

export default TreeContext
