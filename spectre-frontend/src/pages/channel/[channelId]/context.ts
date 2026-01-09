import { createContext, useMemo } from 'react'
import type { TabArgs } from '@/pages/channel/[channelId]/_tabs/tab-constant.ts'

type CommandExecuteCallback = (cmd: string) => void

export type TabOptions = {
  name: string
  isLocked?: boolean
  /**
   * 如果该标签页是唯一的，则需要提供该值，当用户重复打开时，将会跳转而不是开启一个新的
   */
  uniqueId?: string
}
type OpenTabFuncArgs<K extends keyof TabArgs> = TabArgs[K] extends undefined
  ? [key: K, options: TabOptions]
  : [key: K, options: TabOptions, arg: TabArgs[K]]

export type OpenTabFunc = <K extends keyof TabArgs>(
  ...args: OpenTabFuncArgs<K>
) => void

type ChannelContextState = {
  /**
   * 执行 arthas 命令
   */
  execute: CommandExecuteCallback
  openTab: OpenTabFunc
  /**
   * 当执行命令时的回调，该方法仅用于对接 {@link ChannelContextState#execute} 方法，不要用在其它地方
   */
  addCommandExecuteListener: (cb: CommandExecuteCallback) => void
  removeCommandExecuteListener: (cb: CommandExecuteCallback) => void
  addOpenTabListener: (cb: OpenTabFunc) => void
  removeOpenTabListener: (cb: OpenTabFunc) => void
}
const ChannelContext = createContext<ChannelContextState>({
  execute() {},
  openTab() {},
  addCommandExecuteListener() {},
  removeCommandExecuteListener() {},
  addOpenTabListener() {},
  removeOpenTabListener() {},
})
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

export const useChannelContext = (): ChannelContextState => {
  return useMemo<ChannelContextState>(() => {
    const commandExecuteDispatcher =
      createListenerDispatcher<CommandExecuteCallback>()
    const tabDispatcher = createListenerDispatcher<OpenTabFunc>()
    return {
      execute(cmd) {
        commandExecuteDispatcher.trigger(cmd)
      },
      openTab(...args) {
        const myArgs = args as unknown as Parameters<OpenTabFunc>
        tabDispatcher.trigger(...myArgs)
      },
      addCommandExecuteListener(listener) {
        commandExecuteDispatcher.addListener(listener)
      },
      removeCommandExecuteListener(listener) {
        commandExecuteDispatcher.removeListener(listener)
      },
      addOpenTabListener(listener) {
        tabDispatcher.addListener(listener)
      },
      removeOpenTabListener(listener) {
        tabDispatcher.removeListener(listener)
      },
    }
  }, [])
}

export default ChannelContext
