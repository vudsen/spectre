import React, { useMemo } from 'react'
import { getArthasMessageView, type PreviewInfo } from './factory.ts'
import clsx from 'clsx'
import { Tooltip } from '@heroui/react'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

interface ArthasResponsePreviewProps {
  message: ArthasMessage
}
const ArthasResponsePreview: React.FC<ArthasResponsePreviewProps> = (props) => {
  const state: PreviewInfo = useMemo(() => {
    return (
      getArthasMessageView(props.message.value.type)?.display(
        props.message,
      ) ?? {
        name: '<Unknown>',
        color: 'default',
        tag: props.message.value.type,
        tabName: 'Unknown',
      }
    )
  }, [props.message])

  return (
    <div className="flex items-center">
      <div className="border-r-divider h-full border-r-2 text-center italic">
        <span
          className={clsx('block w-24 text-sm italic', {
            'text-danger': state.color === 'danger',
            'text-primary': state.color === 'primary',
            'text-success': state.color === 'success',
          })}
        >
          {state.tag}
        </span>
      </div>
      <Tooltip
        content={state.name}
        classNames={{ content: 'max-w-96 break-all' }}
        delay={200}
        closeDelay={100}
      >
        <span className="text-default-500 ml-2 truncate text-sm">
          {state.name}
        </span>
      </Tooltip>
    </div>
  )
}

export default ArthasResponsePreview
