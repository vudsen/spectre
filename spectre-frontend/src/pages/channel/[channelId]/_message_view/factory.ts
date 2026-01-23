import type { ChipProps } from '@heroui/react'
import type { PureArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'

export type PreviewInfo = {
  name: string
  color: ChipProps['color']
  tag: string
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
  display: (message: T) => PreviewInfo
}

const configMap: Record<string, RegisterConfiguration<PureArthasResponse>> = {}

export function registerMessageView<T extends PureArthasResponse>(
  conf: RegisterConfiguration<T>,
) {
  configMap[conf.type] = conf as RegisterConfiguration<PureArthasResponse>
}

export function getArthasMessageView(
  type: string,
): RegisterConfiguration<PureArthasResponse> | undefined {
  return configMap[type]
}
