import type { ArthasResponse } from '@/api/impl/arthas.ts'
import React, { useMemo } from 'react'
import { getArthasMessageView } from '@/pages/channel/[channelId]/_message_view/factory.ts'

interface ArthasResponseDetailProps {
  message: ArthasResponse
}
const ArthasResponseDetail: React.FC<ArthasResponseDetailProps> = (props) => {
  const Component = useMemo(() => {
    return getArthasMessageView(props.message.type)?.detailComponent
  }, [props.message.type])

  if (!Component) {
    return (
      <div className="italic">
        🚧该消息暂不支持预览，请使用`原始内容`查看。我们正在全力开发中，敬请期待🚧
      </div>
    )
  }
  return <Component msg={props.message} />
}

export default ArthasResponseDetail
