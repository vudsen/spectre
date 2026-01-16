import {
  type ArthasResponseWithId,
  executeArthasCommand,
  type InputStatusResponse,
  interruptCommand,
  pullResults,
} from '@/api/impl/arthas.ts'
import { useEffect, useMemo } from 'react'
import {
  appendMessages,
  clearExpiredMessages,
  updateInputStatus,
} from '@/store/channelSlice.ts'
import { store } from '@/store'
import { useDispatch } from 'react-redux'
import type { Dispatch } from '@reduxjs/toolkit'

interface Listener {
  onMessage?: (messages: ArthasResponseWithId[]) => void
  afterExecute?: (command: string, fail: boolean) => void
}

export type ArthasMessageBus = {
  /**
   * 添加监听器
   * @return {number} 监听器id
   */
  addListener(listener: Listener): number
  /**
   * 移除监听器
   * @param listenerId 监听器id
   */
  removeListener(listenerId: number): void
  /**
   * 执行命令
   * @param command 要执行的命令
   * @param interruptCurrent 是否中止当前正在执行的命令
   */
  execute(command: string, interruptCurrent?: boolean): Promise<void>
}

let globalId = Date.now()

type PollState = {
  taskDelay: number
  isExcited: boolean
  isFetching: boolean
  pullResultsTaskId?: number
}

type ArthasMessageBusInternal = {
  launchPullResultTask: () => void
  pullNow: () => void
  state: PollState
} & ArthasMessageBus

const classloaderHashRegx = /-c +[\da-zA-Z]{8}/

const createArthasMessageBusInternal = (
  dispatch: Dispatch,
): ArthasMessageBusInternal => {
  const listenerMap = new Map<number, Listener>()
  const state: PollState = {
    taskDelay: 0,
    isFetching: false,
    isExcited: false,
  }

  const doPullResults = async (): Promise<number> => {
    const channelId = store.getState().channel.context.channelId
    const r = await pullResults(channelId)
    for (const resp of r) {
      if (resp.type === 'input_status') {
        const status = (resp as InputStatusResponse).inputStatus
        dispatch(updateInputStatus(status))
      }
    }
    if (r.length > 0) {
      for (const entry of listenerMap.entries()) {
        entry[1].onMessage?.(r)
      }
      dispatch(
        appendMessages({
          messages: r,
          channelId,
        }),
      )
    }
    return r.length
  }

  const launchPullResultTask = () => {
    if (state.isExcited || state.isFetching) {
      return
    }
    state.isFetching = true
    doPullResults()
      .then((messageCount) => {
        if (messageCount > 0) {
          state.taskDelay = 0
        } else {
          state.taskDelay = Math.min(state.taskDelay + 1000, 20 * 1000)
        }
      })
      .catch((_) => {
        state.taskDelay = Math.min(state.taskDelay + 5000, 20 * 1000)
      })
      .finally(() => {
        state.pullResultsTaskId = setTimeout(() => {
          launchPullResultTask()
        }, state.taskDelay)
        state.isFetching = false
      })
  }

  const pullNow = () => {
    if (state.pullResultsTaskId) {
      clearTimeout(state.pullResultsTaskId)
    }
    state.taskDelay = 0
    launchPullResultTask()
  }

  const addListener: ArthasMessageBus['addListener'] = (listener) => {
    const myId = globalId++
    listenerMap.set(myId, listener)
    return myId
  }

  const removeListener: ArthasMessageBus['removeListener'] = (listenerId) => {
    listenerMap.delete(listenerId)
  }

  const execute: ArthasMessageBus['execute'] = async (
    command,
    interruptCurrent,
  ) => {
    const context = store.getState().channel.context
    const channelId = context.channelId
    if (interruptCurrent && context.inputStatus === 'ALLOW_INTERRUPT') {
      await interruptCommand(channelId)
    }

    let finalCommand = command
    if (context.classloaderHash) {
      const r = classloaderHashRegx.exec(command)
      if (!r || r.length === 0) {
        finalCommand = `${command} -c ${context.classloaderHash}`
      }
    }

    let fail = true
    try {
      await executeArthasCommand(channelId, finalCommand)
      pullNow()
      fail = false
    } finally {
      for (const entry of listenerMap.entries()) {
        entry[1].afterExecute?.(command, fail)
      }
    }
  }

  return {
    launchPullResultTask,
    pullNow,
    addListener,
    removeListener,
    execute,
    state,
  }
}

const useArthasMessageBus = (): ArthasMessageBus => {
  const dispatch = useDispatch()
  const internalBus = useMemo(
    () => createArthasMessageBusInternal(dispatch),
    [dispatch],
  )

  useEffect(() => {
    const state = internalBus.state
    state.isExcited = false
    internalBus.launchPullResultTask()
    dispatch(clearExpiredMessages())
    return () => {
      state.isExcited = true
      if (state.pullResultsTaskId) {
        clearTimeout(state.pullResultsTaskId)
      }
    }
  }, [dispatch, internalBus])

  // 偷个懒
  return internalBus
}

export default useArthasMessageBus
