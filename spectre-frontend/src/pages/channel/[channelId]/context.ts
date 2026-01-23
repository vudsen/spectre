import { createContext } from 'react'
import type { TabsControllerRef } from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import type { QuickCommandRef } from '@/pages/channel/[channelId]/_component/QuickCommand'
import type { ArthasMessageBus } from '@/pages/channel/[channelId]/useArthasMessageBus.tsx'

export type TabOptions = {
  name?: string
  isLocked?: boolean
  icon?: string
  /**
   * 如果该标签页是唯一的，则需要提供该值，当用户重复打开时，将会跳转而不是开启一个新的
   */
  uniqueId?: React.Key
  hoverMessage?: string
}

export type ChannelContextState = {
  getTabsController: () => TabsControllerRef
  getQuickCommandExecutor: () => QuickCommandRef
  messageBus: ArthasMessageBus
}
const ChannelContext = createContext<ChannelContextState>({
  messageBus: null!,
  getTabsController: () => null!,
  getQuickCommandExecutor: () => null!,
})

export default ChannelContext
