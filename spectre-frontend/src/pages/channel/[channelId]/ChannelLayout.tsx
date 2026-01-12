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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void
type Dispatcher<T extends AnyFn> = {
  trigger: (...arg: Parameters<T>) => void
  addListener: (listener: T) => void
  removeListener: (listener: T) => void
}

function createListenerDispatcher<T extends AnyFn>(): Dispatcher<T> {
  const listeners: T[] = []
  return {
    addListener(listener) {
      listeners.push(listener)
    },
    removeListener(listener) {
      const pos = listeners.findIndex((l) => l === listener)
      if (pos < 0) {
        return
      }
      listeners.splice(pos, 1)
    },
    trigger: function (...args) {
      for (const listener of listeners) {
        listener(...args)
      }
    },
  }
}

interface ChannelLayoutProps {
  channelId: string
  appName: string
}

const ChannelLayout: React.FC<ChannelLayoutProps> = (props) => {
  const tabsController = useRef<TabsControllerRef>(null)
  const contextValue = useMemo<ChannelContextState>(() => {
    const commandExecuteDispatcher = createListenerDispatcher()
    return {
      execute(cmd) {
        commandExecuteDispatcher.trigger(cmd)
      },
      addCommandExecuteListener(listener) {
        commandExecuteDispatcher.addListener(listener)
      },
      removeCommandExecuteListener(listener) {
        commandExecuteDispatcher.removeListener(listener)
      },
      getTabsController() {
        return tabsController.current!
      },
    }
  }, [])

  return (
    <>
      <ChannelSvgSymbols />
      <ChannelContext value={contextValue}>
        <Header {...props} />
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
