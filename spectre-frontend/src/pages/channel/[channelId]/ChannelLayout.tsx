import Header from '@/pages/channel/[channelId]/Header.tsx'
import Toolbar from '@/pages/channel/[channelId]/Toolbar.tsx'
import TabsController, {
  type TabsControllerRef,
} from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import ChannelSvgSymbols from '@/pages/channel/[channelId]/_channel_icons/svg-symbols.tsx'
import React, { useMemo, useRef, useState } from 'react'
import ChannelContext, {
  type ChannelContextState,
} from '@/pages/channel/[channelId]/context.ts'
import type { QuickCommandRef } from '@/pages/channel/[channelId]/_component/QuickCommand'
import useArthasMessageBus from '@/pages/channel/[channelId]/useArthasMessageBus.tsx'
import AiPanel from '@/pages/channel/[channelId]/_ai/AiPanel.tsx'
import './_message_view/init.ts'

interface ChannelLayoutProps {
  channelId: string
  appName: string
}

const ChannelLayout: React.FC<ChannelLayoutProps> = (props) => {
  const bus = useArthasMessageBus(props.channelId)
  const tabsController = useRef<TabsControllerRef>(null)
  const quickCommandRef = useRef<QuickCommandRef>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const contextValue = useMemo<ChannelContextState | null>(() => {
    if (!bus) {
      return null
    }
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

  if (!contextValue) {
    return
  }
  return (
    <>
      <ChannelSvgSymbols />
      <ChannelContext value={contextValue}>
        <div className="flex">
          <div className="w-0 grow">
            <Header
              {...props}
              aiConsoleOpen={aiOpen}
              onAiConsoleToggle={() => {
                setAiOpen((old) => !old)
              }}
              ref={quickCommandRef}
            />
            <div className="flex">
              <div className="flex min-w-0 grow">
                <Toolbar />
                <TabsController ref={tabsController} />
              </div>
            </div>
          </div>
          <AiPanel
            channelId={props.channelId}
            isOpen={aiOpen}
            onClose={() => setAiOpen(false)}
          />
        </div>
      </ChannelContext>
    </>
  )
}

export default ChannelLayout
