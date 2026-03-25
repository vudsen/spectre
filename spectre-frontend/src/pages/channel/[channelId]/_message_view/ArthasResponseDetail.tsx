import type { PureArthasResponse } from '@/api/impl/arthas.ts'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { type DetailComponentProps, getArthasMessageView } from './factory.ts'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import { ErrorBoundary } from 'react-error-boundary'
import i18n from '@/i18n'

interface ArthasResponseDetailProps {
  message: ArthasMessage
}
const ArthasResponseDetail: React.FC<ArthasResponseDetailProps> = (props) => {
  const Component = useMemo(() => {
    return getArthasMessageView(props.message.value.type)?.detailComponent
  }, [props.message.value.type]) as React.FC<
    DetailComponentProps<PureArthasResponse>
  >
  const componentCache = useRef(new Map())
  const [dirtyIds, setDirtyIds] = useState(new Set<string>())

  const handleOnDirty = useCallback(
    (id: string) => {
      if (!dirtyIds.has(id)) {
        setDirtyIds((prev) => new Set(prev).add(id))
      }
    },
    [dirtyIds],
  )

  const renderDetail = useCallback(
    (
      id: string,
      Component: React.FC<DetailComponentProps<PureArthasResponse>>,
    ) => {
      // 1. 如果已经在缓存池里，直接返回缓存的实例
      if (componentCache.current.has(id)) {
        return componentCache.current.get(id)
      }

      // 2. 如果不在缓存中，创建一个新的实例
      const newComponent = (
        <Component
          key={props.message.id} // 必须有稳定的 key
          msg={props.message.value}
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
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_arthasresponsedetail_001',
        )}
      </div>
    )
  }
  if (
    dirtyIds.has(props.message.id) &&
    !componentCache.current.has(props.message.id)
  ) {
    componentCache.current.set(
      props.message.id,
      renderDetail(props.message.id, Component),
    )
  }
  const currentId = props.message.id
  return (
    <>
      {props.message.context.command ? (
        <div className="bg-primary-50 text-primary-700 px-6 py-3 text-sm">
          {i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_arthasresponsedetail_002',
          )}{' '}
          {props.message.context.command}
        </div>
      ) : null}
      {/* 策略：对于脏组件，我们全部渲染但在 CSS 上隐藏；对于非脏组件，动态切换 */}
      {Array.from(componentCache.current.entries()).map(([id, node]) => (
        <div
          className="mt-2 px-2 pb-6"
          key={id}
          style={{ display: currentId === id ? 'block' : 'none' }}
        >
          {node}
        </div>
      ))}

      {/* 处理尚未变脏且未进入缓存的新组件 */}
      {!componentCache.current.has(currentId) && (
        <div className="mt-2 px-2 pb-6" key={currentId}>
          <ErrorBoundary
            fallback={
              <div className="text-danger">
                {i18n.t(
                  'hardcoded.msg_pages_channel_param_message_view_arthasresponsedetail_003',
                )}
              </div>
            }
          >
            {renderDetail(currentId, Component)}
          </ErrorBoundary>
        </div>
      )}
    </>
  )
}

export default ArthasResponseDetail
