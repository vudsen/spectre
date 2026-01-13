import { createContext } from 'react'
import type { TabsControllerRef } from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import type { QuickCommandRef } from '@/pages/channel/[channelId]/_component/QuickCommand'

type CommandExecuteCallback = (cmd: string, interruptCurrent?: boolean) => void

export type TabOptions = {
  name?: string
  isLocked?: boolean
  /**
   * 如果该标签页是唯一的，则需要提供该值，当用户重复打开时，将会跳转而不是开启一个新的
   */
  uniqueId?: string
  hoverMessage?: string
}

export type ChannelContextState = {
  getTabsController: () => TabsControllerRef
  getQuickCommandExecutor: () => QuickCommandRef
  /**
   * 执行 arthas 命令
   */
  execute: CommandExecuteCallback
  /**
   * 当执行命令时的回调，该方法仅用于对接 {@link ChannelContextState#execute} 方法，不要用在其它地方
   */
  addCommandExecuteListener: (cb: CommandExecuteCallback) => void
  removeCommandExecuteListener: (cb: CommandExecuteCallback) => void
}
const ChannelContext = createContext<ChannelContextState>({
  execute() {},
  getTabsController: () => null!,
  getQuickCommandExecutor: () => null!,
  addCommandExecuteListener() {},
  removeCommandExecuteListener() {},
})

export default ChannelContext
