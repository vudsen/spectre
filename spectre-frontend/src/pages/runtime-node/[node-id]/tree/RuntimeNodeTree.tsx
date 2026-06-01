import { type MouseEvent } from 'react'
import React, { useContext, useRef, useState } from 'react'
import { expandTree, type JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { Button, Checkbox, Spinner } from '@heroui/react'
import TreeContext from '@/pages/runtime-node/[node-id]/tree/context.ts'
import { useDispatch, useSelector } from 'react-redux'
import {
  onBatchSelect,
  setCurrentSelected,
} from '@/store/runtimeNodeTreeSlice.ts'
import type { RootState } from '@/store'
import clsx from 'clsx'

type NodeProps = {
  searchNode: JvmTreeNodeDTO
  level: number
  id?: string
  onExpanded?: () => void
  isTourAttachTarget?: boolean
}

const RuntimeNodeTree: React.FC<NodeProps> = ({
  id,
  isTourAttachTarget,
  level,
  onExpanded,
  searchNode,
}) => {
  const batchSelectedNodes = useSelector<RootState, JvmTreeNodeDTO[]>(
    (state) => state.runtimeNodeTree.batchSelectedNodes,
  )
  const currentSelectedNode = useSelector<
    RootState,
    JvmTreeNodeDTO | undefined
  >((state) => state.runtimeNodeTree.currentSelect)
  const searchContent = useSelector<RootState, string>(
    (state) => state.runtimeNodeTree.searchContent,
  )

  const [rootNodes, setRootnNodes] = useState<JvmTreeNodeDTO[]>([])
  const [expand, setExpand] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadedFlag = useRef(false)
  const ctx = useContext(TreeContext)
  const dispatch = useDispatch()

  const selected =
    currentSelectedNode?.id === searchNode.id ||
    !!batchSelectedNodes.find((node) => node.id === searchNode.id)

  const needsHighlight =
    searchContent.length > 0 && searchNode.name.includes(searchContent)

  const toggleTreeNode = (force?: boolean) => {
    if (loading) {
      return
    }
    if (!force) {
      setExpand(!expand)
      if (loadedFlag.current) {
        return
      }
    }
    setLoading(true)
    expandTree(ctx.nodeId, searchNode.id)
      .then((r) => {
        loadedFlag.current = true
        setRootnNodes(r)
        onExpanded?.()
      })
      .catch((_) => {
        setExpand(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const onclick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      e.target instanceof SVGElement &&
      Icon.RIGHT === e.target.getAttribute('icon')
    ) {
      toggleTreeNode()
    }
    if (currentSelectedNode?.id === searchNode.id) {
      return
    }
    dispatch(setCurrentSelected(searchNode))
  }

  const attach = () => {
    ctx.requireAttach(searchNode)
  }

  const onBatchSelect0 = (b: boolean) => {
    dispatch(
      onBatchSelect({
        node: searchNode,
        select: b,
      }),
    )
  }

  return (
    <div className="w-full px-3" id={id}>
      <div
        className={clsx(
          'group box-border flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 select-none',
          needsHighlight ? 'text-yellow-500' : '',
          selected ? 'bg-primary-100' : 'hover:bg-default-100',
        )}
        onDoubleClick={() => toggleTreeNode()}
        onClick={onclick}
      >
        <div className="flex h-[34px] max-w-2/3 items-center">
          {loadedFlag.current && rootNodes.length == 0 ? (
            <span className="mx-2" />
          ) : loading ? (
            <Spinner variant="gradient" size="sm" />
          ) : (
            <SvgIcon icon={Icon.RIGHT} className={expand ? 'rotate-90' : ''} />
          )}
          {searchNode.isJvm ? (
            <>
              <Checkbox onValueChange={onBatchSelect0} className="ml-0.5" />
              <SvgIcon
                icon={Icon.COFFEE}
                size={22}
                id={isTourAttachTarget ? 'jvm-flag' : undefined}
              />
            </>
          ) : null}
          <span className="mx-2 max-w-[90%] truncate">{searchNode.name}</span>
        </div>
        <div className={`${selected ? '' : 'hidden group-hover:inline-flex'}`}>
          <Button isIconOnly size="sm" variant="light">
            <SvgIcon icon={Icon.VIEW} size={22} className="text-primary" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className={searchNode.isJvm ? '' : 'hidden'}
            onPress={attach}
          >
            <SvgIcon
              icon={Icon.PLUG}
              size={22}
              className="text-primary"
              id={isTourAttachTarget ? 'plug-flag' : undefined}
            />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => toggleTreeNode(true)}
          >
            <SvgIcon icon={Icon.REFRESH} size={22} className="text-primary" />
          </Button>
        </div>
      </div>
      <div className={expand ? '' : 'hidden'}>
        {loadedFlag.current
          ? rootNodes.map((node) => (
              <RuntimeNodeTree
                isTourAttachTarget={
                  ctx.tour && node.isJvm && node.name === 'Test Jvm'
                }
                key={node.id}
                searchNode={node}
                level={level + 1}
              />
            ))
          : null}
      </div>
    </div>
  )
}

export default RuntimeNodeTree
