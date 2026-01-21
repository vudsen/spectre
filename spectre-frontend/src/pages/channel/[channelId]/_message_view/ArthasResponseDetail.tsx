import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { type DetailComponentProps, getArthasMessageView } from './factory.ts'

interface ArthasResponseDetailProps {
  message: ArthasResponseWithId
}
const ArthasResponseDetail: React.FC<ArthasResponseDetailProps> = (props) => {
  const Component = useMemo(() => {
    return getArthasMessageView(props.message.type)?.detailComponent
  }, [props.message.type])
  const componentCache = useRef(new Map())
  const [dirtyIds, setDirtyIds] = useState(new Set<number>())

  const handleOnDirty = useCallback(
    (id: number) => {
      if (!dirtyIds.has(id)) {
        setDirtyIds((prev) => new Set(prev).add(id))
      }
    },
    [dirtyIds],
  )

  const renderDetail = useCallback(
    (
      id: number,
      Component: React.FC<DetailComponentProps<ArthasResponseWithId>>,
    ) => {
      // 1. 如果已经在缓存池里，直接返回缓存的实例
      if (componentCache.current.has(id)) {
        return componentCache.current.get(id)
      }

      // 2. 如果不在缓存中，创建一个新的实例
      const newComponent = (
        <Component
          key={props.message.fid} // 必须有稳定的 key
          msg={props.message}
          onDirty={() => handleOnDirty(id)}
        />
      )
      // 3. 注意：这里先不存入 Map，只有当它变“脏”时，我们才在渲染周期外或利用逻辑确保它被持有
      // 或者更激进一点：只要打开过就缓存（类似 Keep-Alive）
      return newComponent
    },
    [handleOnDirty, props.message],
  )

  if (!Component) {
    return (
      <div className="italic">
        🚧该消息暂不支持预览，请使用`原始内容`查看。我们正在全力开发中，敬请期待🚧
      </div>
    )
  }
  if (
    dirtyIds.has(props.message.fid) &&
    !componentCache.current.has(props.message.fid)
  ) {
    componentCache.current.set(
      props.message.fid,
      renderDetail(props.message.fid, Component),
    )
  }
  const currentId = props.message.fid
  return (
    <>
      {/* 策略：对于脏组件，我们全部渲染但在 CSS 上隐藏；对于非脏组件，动态切换 */}
      {Array.from(componentCache.current.entries()).map(([id, node]) => (
        <div key={id} style={{ display: currentId === id ? 'block' : 'none' }}>
          {node}
        </div>
      ))}

      {/* 处理尚未变脏且未进入缓存的新组件 */}
      {!componentCache.current.has(currentId) && (
        <div key={currentId}>{renderDetail(currentId, Component)}</div>
      )}
    </>
  )
}

export default ArthasResponseDetail
