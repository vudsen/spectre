import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import Index from '@/pages/channel/[channelId]/_tabs/_console'
import { type TabOptions } from '@/pages/channel/[channelId]/context.ts'
import {
  type TabArgs,
  TabComponents,
} from '@/pages/channel/[channelId]/_tabs/tab-constant.ts'
import clsx from 'clsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import RightClickMenu from '@/components/RightClickMenu/RightClickMenu.tsx'
import { ListboxItem } from '@heroui/react'
import useRightClickMenu from '@/components/RightClickMenu/useRightClickMenu.ts'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'

type TabInfo = {
  node: React.ReactNode
  icon?: string
  id: number | string
} & TabOptions

type OpenTabFuncArgs<K extends keyof TabArgs> = TabArgs[K] extends undefined
  ? [key: K, options: TabOptions]
  : [key: K, options: TabOptions, arg: TabArgs[K]]

export type OpenTabFunc = <K extends keyof TabArgs>(
  ...args: OpenTabFuncArgs<K>
) => void

let gid = Date.now()

export interface TabsControllerRef {
  openTab: OpenTabFunc
}

interface TabsControllerProps {
  ref: React.RefObject<TabsControllerRef | null>
}

const TabsController: React.FC<TabsControllerProps> = (props) => {
  const [activeTabId, setActiveTabId] = useState<string | number>(0)
  const { menuProps, onContextMenu } = useRightClickMenu()
  const currentHoverTab = useRef<TabInfo | undefined>(undefined)
  const [tabs, setTabs] = useState<TabInfo[]>(() => {
    // always open
    return [
      {
        node: <Index />,
        name: 'Console',
        icon: ChannelIcon.TERMINAL,
        isLocked: true,
        id: 0,
      },
    ]
  })

  useImperativeHandle(props.ref, () => ({
    openTab(...args) {
      const name = args[0]
      const holder = TabComponents[name]
      const props = args[2] ?? {}
      const options = Object.assign(holder.defaultPropsFactory(props), args[1])
      const id = options.uniqueId ?? gid++
      if (options.uniqueId) {
        setActiveTabId(options.uniqueId)
      }
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
    },
  }))

  const switchTab = (id: number | string) => {
    setActiveTabId(id)
  }

  const closeCurrentTab = (
    id: number | string,
    e?: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e?.stopPropagation()
    const pos = tabs.findIndex((tab) => tab.id === id)
    if (pos < 0) {
      console.error(`tab not found, id: ${id}`)
      return
    }
    const nextId = tabs[pos - 1].id

    setActiveTabId(nextId)
    setTabs(tabs.toSpliced(pos, 1))
  }

  const closeAll = useCallback(() => {
    setTabs((prevState) => {
      const newTabs: TabInfo[] = []
      for (const tab of prevState) {
        if (tab.isLocked) {
          newTabs.push(tab)
        }
      }
      return newTabs
    })
    setActiveTabId(0)
  }, [])

  const onContextMenu0 = (e: React.MouseEvent<unknown>, tab: TabInfo) => {
    currentHoverTab.current = tab
    onContextMenu(e)
  }

  const closeOther = useCallback(() => {
    setTabs((prevState) => {
      const newTabs: TabInfo[] = []
      for (const tab of prevState) {
        if (tab.isLocked || tab.id === currentHoverTab.current!.id) {
          newTabs.push(tab)
        }
      }
      return newTabs
    })
    setActiveTabId(currentHoverTab.current!.id)
  }, [])

  const onAction = (key: string | number) => {
    switch (key) {
      case 'close':
        closeCurrentTab(currentHoverTab.current!.id)
        break
      case 'closeAll':
        closeAll()
        break
      case 'closeOther':
        closeOther()
        break
    }
  }

  return (
    <>
      <RightClickMenu onAction={onAction} {...menuProps}>
        <ListboxItem key="close">关闭</ListboxItem>
        <ListboxItem key="closeAll">关闭全部</ListboxItem>
        <ListboxItem key="closeOther">关闭其它</ListboxItem>
      </RightClickMenu>
      <div className="flex w-0 grow flex-col">
        <div className="border-b-divider flex flex-wrap border-b-1 select-none">
          {tabs.map((tab) => (
            <div
              onContextMenu={(e) => onContextMenu0(e, tab)}
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
                  <div onClick={(e) => closeCurrentTab(tab.id, e)}>x</div>
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
                'relative h-full overflow-scroll',
              )}
              style={{ transform: 'translate3d(0, 0, 0)' }}
            >
              {tab.node}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default TabsController
