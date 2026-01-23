import type { ChipProps } from '@heroui/react'
import type { PureArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

export type PreviewInfo = {
  name: string
  color: ChipProps['color']
  tag: string
  tabName: string
}

export interface DetailComponentProps<T extends PureArthasResponse> {
  msg: T
  /**
   * 表示当前视图已经“脏”了，需要进行持久化，以免用户下次进入时丢失相关数据
   */
  onDirty?: () => void
}

export type RegisterConfiguration<T extends PureArthasResponse> = {
  type: string
  detailComponent?: React.FC<DetailComponentProps<T>>
  display: (message: ArthasMessage<T>) => Partial<PreviewInfo>
}

export type ArthasMessageView<T extends PureArthasResponse> = {
  detailComponent?: React.FC<DetailComponentProps<T>>
  display: (message: ArthasMessage<T>) => PreviewInfo
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configMap: Record<string, ArthasMessageView<any>> = {}

export function registerMessageView<T extends PureArthasResponse>(
  conf: RegisterConfiguration<T>,
) {
  configMap[conf.type] = {
    detailComponent: conf.detailComponent,
    display(message): PreviewInfo {
      const base: PreviewInfo = {
        name: conf.type,
        tag: conf.type,
        color: 'default',
        tabName: message.context.command ?? conf.type,
      }
      return Object.assign(base, conf.display(message))
    },
  }
}

export function getArthasMessageView(
  type: string,
): ArthasMessageView<PureArthasResponse> | undefined {
  return configMap[type]
}
