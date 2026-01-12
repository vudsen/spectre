import type { ChipProps } from '@heroui/react'
import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import type React from 'react'

export type PreviewInfo = {
  name: string
  color: ChipProps['color']
  tag: string
}

export interface DetailComponentProps<T extends ArthasResponseWithId> {
  msg: T
  /**
   * 表示当前视图已经“脏”了，需要进行持久化，以免用户下次进入时丢失相关数据
   */
  onDirty?: () => void
}

export type RegisterConfiguration<T extends ArthasResponseWithId> = {
  type: string
  detailComponent?: React.FC<DetailComponentProps<T>>
  display: (message: T) => PreviewInfo
}

const configMap: Record<
  string,
  RegisterConfiguration<ArthasResponseWithId>
> = {}

export function registerMessageView<T extends ArthasResponseWithId>(
  conf: RegisterConfiguration<T>,
) {
  configMap[conf.type] = conf as RegisterConfiguration<ArthasResponseWithId>
}

export function getArthasMessageView(
  type: string,
): RegisterConfiguration<ArthasResponseWithId> | undefined {
  return configMap[type]
}
