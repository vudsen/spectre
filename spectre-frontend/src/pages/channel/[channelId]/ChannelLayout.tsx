import Header from '@/pages/channel/[channelId]/Header.tsx'
import Toolbar from '@/pages/channel/[channelId]/Toolbar.tsx'
import TabsController, {
  type TabsControllerRef,
} from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import ChannelSvgSymbols from '@/pages/channel/[channelId]/_channel_icons/svg-symbols.tsx'
import React, { useMemo, useRef } from 'react'
import ChannelContext, {
  type ChannelContextState,
} from '@/pages/channel/[channelId]/context.ts'
import type { QuickCommandRef } from '@/pages/channel/[channelId]/_component/QuickCommand'
import useArthasMessageBus from '@/pages/channel/[channelId]/useArthasMessageBus.tsx'
import './_message_view/init.ts'

interface ChannelLayoutProps {
  channelId: string
  appName: string
}

const ChannelLayout: React.FC<ChannelLayoutProps> = (props) => {
  const bus = useArthasMessageBus()
  const tabsController = useRef<TabsControllerRef>(null)
  const quickCommandRef = useRef<QuickCommandRef>(null)
  const contextValue = useMemo<ChannelContextState>(() => {
    return {
      messageBus: bus,
      getTabsController() {
        return tabsController.current!
      },
      getQuickCommandExecutor() {
        return quickCommandRef.current!
      },
    }
  }, [bus])

  return (
    <>
      <ChannelSvgSymbols />
      <ChannelContext value={contextValue}>
        <Header {...props} ref={quickCommandRef} />
        <div>
          <div className="flex">
            <Toolbar />
            <TabsController ref={tabsController} />
          </div>
        </div>
      </ChannelContext>
    </>
  )
}
export default ChannelLayout
