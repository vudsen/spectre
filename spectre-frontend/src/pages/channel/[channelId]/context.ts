import { createContext, useMemo } from 'react'

type CommandExecuteCallback = (cmd: string) => void
type ChannelContextState = {
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
  addCommandExecuteListener() {},
  execute() {},
  removeCommandExecuteListener() {},
})

export const useChannelContext = (): ChannelContextState => {
  return useMemo<ChannelContextState>(() => {
    const listeners: CommandExecuteCallback[] = []
    return {
      execute(cmd) {
        for (const listener of listeners) {
          listener(cmd)
        }
      },
      addCommandExecuteListener(listener) {
        listeners.push(listener)
      },
      removeCommandExecuteListener(listener) {
        const i = listeners.findIndex((v) => v === listener)
        if (i >= 0) {
          listeners.splice(i, 1)
        }
        console.log(listeners)
      },
    }
  }, [])
}

export default ChannelContext
