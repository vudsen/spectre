import JadPage, {
  type JadPageProps,
} from '@/pages/channel/[channelId]/_tabs/_jad'
import type React from 'react'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import type { TabOptions } from '@/pages/channel/[channelId]/context.ts'
import DashBoardTab from '@/pages/channel/[channelId]/_tabs/_dashboard'

export interface TabArgs {
  JAD: JadPageProps
  DASHBOARD: undefined
}

type ComponentHolder<T> = {
  Component: React.FC<T>
  icon?: string
  defaultPropsFactory: (props: T) => Partial<TabOptions>
}

const JAD: ComponentHolder<JadPageProps> = {
  Component: JadPage,
  icon: ChannelIcon.JAVA,
  defaultPropsFactory: (props) => ({
    name:
      props.classname.substring(props.classname.lastIndexOf('.') + 1) +
      '.class',
    uniqueId: `jad:${props.classname}`,
    hoverMessage: props.classname,
  }),
}

const DASHBOARD: ComponentHolder<object> = {
  Component: DashBoardTab,
  icon: ChannelIcon.DASHBOARD,
  defaultPropsFactory: () => ({
    uniqueId: 'dashboard',
    name: 'Dashboard',
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TabComponents: Record<string, ComponentHolder<any>> = {
  JAD,
  DASHBOARD,
}
