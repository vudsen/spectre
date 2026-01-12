import JadPage, {
  type JadPageProps,
} from '@/pages/channel/[channelId]/_tabs/_jad'
import type React from 'react'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import type { TabOptions } from '@/pages/channel/[channelId]/context.ts'

export interface TabArgs {
  JAD: JadPageProps
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TabComponents: Record<string, ComponentHolder<any>> = {
  JAD,
}
