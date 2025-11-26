import React, { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { expandTree, type JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import RuntimeNodeTree from '@/pages/runtime-node/[node-id]/tree/RuntimeNodeTree.tsx'
import TreeContext, {
  type NodeTreeContext,
} from '@/pages/runtime-node/[node-id]/tree/context.ts'
import ToolchainSelectModal from '@/pages/runtime-node/[node-id]/tree/ToolchainSelectModal.tsx'
import { Input, Skeleton, useDisclosure } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

const RuntimeNodeTreePage: React.FC = () => {
  const params = useParams()
  const nodeId = params['node-id'] ?? '-1'
  const [rootNodes, setRootnNodes] = useState<JvmTreeNodeDTO[]>([])
  const [context, setContext] = useState<NodeTreeContext>()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const selectedSearchNode = useRef<JvmTreeNodeDTO>(undefined)
  const nav = useNavigate()
  const [isRootNodeLoading, setRootNodeLoading] = useState(true)

  useEffect(() => {
    let listeners: Array<() => void> = []
    const contentListeners: Array<(content: string) => void> = []
    setContext({
      nodeId,
      subScribeSelectionChangeOnce: (cb) => {
        listeners.push(cb)
        return cb.length - 1
      },
      onSelectionChange() {
        for (const listener of listeners) {
          listener()
        }
        listeners = []
      },
      requireAttach: (searchNode) => {
        selectedSearchNode.current = searchNode
        onOpen()
      },
      subscribeSearchContentChange: (cb) => {
        contentListeners.push(cb)
        return contentListeners.length
      },
      onSearchContentChange: (content: string) => {
        for (const contentListener of contentListeners) {
          contentListener(content)
        }
      },
      unsubscribeSearchContentChange: (id: number) => {
        contentListeners.splice(id, 1)
      },
    })

    expandTree(nodeId)
      .then((nodes) => {
        setRootnNodes(nodes)
      })
      .finally(() => {
        setRootNodeLoading(false)
      })
  }, [nodeId, onOpen])

  const onSelect = (bundleId: string) => {
    nav(
      `../attach?treeNodeId=${selectedSearchNode.current!.id}&bundleId=${bundleId}`,
    )
  }

  const onInput = (e: FormEvent<HTMLInputElement>) => {
    context?.onSearchContentChange((e.target as HTMLInputElement).value)
  }

  if (!context) {
    return null
  }
  return (
    <TreeContext value={context}>
      <div className="mx-6">
        <div className="mb-3 text-xl font-semibold">节点列表</div>
        {isRootNodeLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full rounded-lg">
              <div className="bg-default-200 h-12 w-full rounded-lg" />
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="bg-default-200 h-12 w-full rounded-lg" />
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="bg-default-200 h-12 w-full rounded-lg" />
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="bg-default-200 h-12 w-full rounded-lg" />
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="bg-default-200 h-12 w-full rounded-lg" />
            </Skeleton>
          </div>
        ) : (
          <div>
            <div className="sticky top-0 box-border bg-white p-3">
              <Input
                size="sm"
                labelPlacement="outside"
                label="搜索"
                onInput={onInput}
                startContent={<SvgIcon icon={Icon.SEARCH} />}
              />
            </div>
            <div>
              {rootNodes.map((node) => (
                <RuntimeNodeTree key={node.id} searchNode={node} level={0} />
              ))}
            </div>
          </div>
        )}
      </div>
      <ToolchainSelectModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        currentNode={selectedSearchNode.current}
      />
    </TreeContext>
  )
}

export default RuntimeNodeTreePage
