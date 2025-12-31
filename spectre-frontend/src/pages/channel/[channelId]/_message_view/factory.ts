import type { ChipProps } from '@heroui/react'
import type { ArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'

export type PreviewInfo = {
  name: string
  color: ChipProps['color']
  tag: string
}

export interface DetailComponentProps<T extends ArthasResponse> {
  msg: T
}

export type RegisterConfiguration<T extends ArthasResponse> = {
  type: string
  detailComponent?: React.FC<DetailComponentProps<T>>
  display: (message: T) => PreviewInfo
}

const configMap: Record<string, RegisterConfiguration<ArthasResponse>> = {}

export function registerMessageView<T extends ArthasResponse>(
  conf: RegisterConfiguration<T>,
) {
  configMap[conf.type] = conf as RegisterConfiguration<ArthasResponse>
}

export function getArthasMessageView(
  type: string,
): RegisterConfiguration<ArthasResponse> | undefined {
  return configMap[type]
}
