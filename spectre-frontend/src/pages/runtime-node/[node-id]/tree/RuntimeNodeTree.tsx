import { type MouseEvent, useEffect } from 'react'
import React, { useContext, useRef, useState } from 'react'
import { expandTree, type JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { Button, Spinner } from '@heroui/react'
import TreeContext from '@/pages/runtime-node/[node-id]/tree/context.ts'

type NodeProps = {
  searchNode: JvmTreeNodeDTO
  level: number
}

const RuntimeNodeTree: React.FC<NodeProps> = (props) => {
  const [rootNodes, setRootnNodes] = useState<JvmTreeNodeDTO[]>([])
  const [expand, setExpand] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadedFlag = useRef(false)
  const ctx = useContext(TreeContext)
  const [selected, setSelected] = useState(false)
  const [highlight, setHighlight] = useState(false)

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
    expandTree(ctx.nodeId, props.searchNode.id)
      .then((r) => {
        loadedFlag.current = true
        setRootnNodes(r)
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
    if (selected) {
      return
    }
    ctx.onSelectionChange()
    setSelected(true)
    ctx.subScribeSelectionChangeOnce(() => {
      setSelected(false)
    })
  }

  const attach = () => {
    ctx.requireAttach(props.searchNode)
  }

  useEffect(() => {
    const id = ctx.subscribeSearchContentChange((content) => {
      if (content.length === 0) {
        setHighlight(false)
      } else {
        setHighlight(props.searchNode.name.includes(content))
      }
    })
    return () => {
      ctx.unsubscribeSearchContentChange(id)
    }
  }, [ctx, props.searchNode.name])

  return (
    <div className="w-full px-3">
      <div
        className={`w-full rounded-xl ${highlight ? 'text-yellow-500' : ''} group box-border flex cursor-pointer items-center justify-between px-2 py-3.5 select-none ${selected ? 'bg-primary-100' : 'hover:bg-default-100'}`}
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
          {props.searchNode.isJvm ? (
            <SvgIcon icon={Icon.COFFEE} size={22} />
          ) : null}
          <span className="mx-2 max-w-[90%] truncate">
            {props.searchNode.name}
          </span>
        </div>
        <div className={`${selected ? '' : 'hidden group-hover:inline-flex'}`}>
          <Button isIconOnly size="sm" variant="light">
            <SvgIcon icon={Icon.VIEW} size={22} className="text-primary" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className={props.searchNode.isJvm ? '' : 'hidden'}
            onPress={attach}
          >
            <SvgIcon icon={Icon.PLUG} size={22} className="text-primary" />
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
                key={node.id}
                searchNode={node}
                level={props.level + 1}
              />
            ))
          : null}
      </div>
    </div>
  )
}

export default RuntimeNodeTree
