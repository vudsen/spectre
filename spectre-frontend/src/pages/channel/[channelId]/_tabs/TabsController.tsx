import React, { useContext, useEffect, useState } from 'react'
import Index from '@/pages/channel/[channelId]/_tabs/_console'
import ChannelContext, {
  type OpenTabFunc,
  type TabOptions,
} from '@/pages/channel/[channelId]/context.ts'
import { TabComponents } from '@/pages/channel/[channelId]/_tabs/tab-constant.ts'
import clsx from 'clsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

type TabInfo = {
  node: React.ReactNode
  icon?: string
  id: number | string
} & TabOptions

let gid = Date.now()
const TabsController: React.FC = () => {
  const context = useContext(ChannelContext)
  const [activeTabId, setActiveTabId] = useState<string | number>(0)
  const [tabs, setTabs] = useState<TabInfo[]>(() => {
    // always open
    return [
      {
        node: <Index />,
        name: 'Console',
        isLocked: true,
        id: 0,
      },
    ]
  })

  useEffect(() => {
    const cb: OpenTabFunc = (...args) => {
      const name = args[0]
      const options = args[1]
      const props = args[2] ?? {}
      const id = options.uniqueId ?? gid++
      console.log(options)
      if (options.uniqueId) {
        setActiveTabId(options.uniqueId)
      }
      const holder = TabComponents[name]
      if (!holder) {
        console.error(`Tab not found`, name)
        return
      }
      setTabs((prevState) => {
        const node = <holder.Component {...props} />
        const oldTab = prevState.find((tab) => tab.id === id)
        if (oldTab) {
          return prevState
        }
        return [
          ...prevState,
          {
            ...options,
            node,
            icon: holder.icon,
            id,
          },
        ]
      })
      setActiveTabId(id)
    }
    context.addOpenTabListener(cb)
    return () => {
      context.removeOpenTabListener(cb)
    }
  }, [context])

  const switchTab = (id: number | string) => {
    setActiveTabId(id)
  }

  const closeCurrentTab = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: number | string,
  ) => {
    e.stopPropagation()
    const pos = tabs.findIndex((tab) => tab.id === id)
    if (pos < 0) {
      console.error(`tab not found, id: ${id}`)
      return
    }
    const nextId = tabs[pos - 1].id

    setActiveTabId(nextId)
    setTabs(tabs.toSpliced(pos, 1))
  }

  return (
    <div className="flex w-0 grow flex-col">
      <div className="border-b-divider flex flex-wrap border-b-1 select-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={clsx(
              tab.id === activeTabId ? 'border-b-primary' : 'border-b-white',
              'group hover:bg-default-100 flex cursor-pointer items-center border-b-3 px-4 py-2 text-sm transition-all',
            )}
            onClick={() => switchTab(tab.id)}
          >
            {tab.icon ? <SvgIcon icon={tab.icon} className="mr-2" /> : null}
            <span>{tab.name}</span>
            <div className="invisible ml-2 font-bold text-gray-400 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {tab.isLocked ? (
                <SvgIcon icon={Icon.LOCK} size={15} />
              ) : (
                <div onClick={(e) => closeCurrentTab(e, tab.id)}>x</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="h-0 grow">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={clsx(
              activeTabId === tab.id ? undefined : 'hidden',
              'h-full overflow-scroll',
            )}
          >
            {tab.node}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TabsController
