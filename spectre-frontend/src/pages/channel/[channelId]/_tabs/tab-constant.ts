import JadPage, {
  type JadPageProps,
} from '@/pages/channel/[channelId]/_tabs/_jad'
import type React from 'react'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'

export interface TabArgs {
  JAD: JadPageProps
}

type ComponentHolder = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.FC<any>
  icon?: string
}

export const TabComponents: Record<string, ComponentHolder> = {
  JAD: {
    Component: JadPage,
    icon: ChannelIcon.JAVA,
  },
}
