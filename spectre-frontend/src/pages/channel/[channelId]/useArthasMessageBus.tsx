import {
  executeArthasCommand,
  type InputStatusResponse,
  interruptCommand,
  pullResults,
} from '@/api/impl/arthas.ts'
import { useEffect, useState } from 'react'
import { setupChannelContext, updateInputStatus } from '@/store/channelSlice.ts'
import { store } from '@/store'
import { useDispatch } from 'react-redux'
import type { Dispatch } from '@reduxjs/toolkit'
import setupDB, { type ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { CommandMessage } from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'

interface Listener {
  onMessage?: (messages: ArthasMessage[]) => void
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
  /**
   * 当前 channel 上的消息. 不一定是全部消息
   */
  messages: ArthasMessage[]
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
  close: () => void
} & ArthasMessageBus

const classloaderHashRegx = /-c +[\da-zA-Z]{8}/
const INPUT_STATUS = 'input_status'
const MAX_BUS_MESSAGE_SIZE = 100
/**
 * 达到最大值后，清理至这么多消息
 */
const BUS_MESSAGE_THRESHOLD = 90

const createArthasMessageBusInternal = async (
  channelId: string,
  dispatch: Dispatch,
): Promise<ArthasMessageBusInternal> => {
  const listenerMap = new Map<number, Listener>()
  const db = await setupDB()
  let currentContextId =
    (await db.findLastContextId(channelId)) ??
    (await db.createNewContext({
      channelId,
    }))
  const messages = await setupMessages()
  const state: PollState = {
    taskDelay: 0,
    isFetching: false,
    isExcited: false,
  }

  async function setupMessages() {
    const messages = await db.listAllMessages(channelId, MAX_BUS_MESSAGE_SIZE)
    if (messages.length === 0) {
      dispatch(
        setupChannelContext({
          channelId,
          inputStatus: 'DISABLED',
        }),
      )
      return messages
    }
    const status = await db.findLastMessage(channelId, INPUT_STATUS)
    dispatch(
      setupChannelContext({
        channelId,
        inputStatus: status
          ? (status.value as InputStatusResponse).inputStatus
          : 'ALLOW_INPUT',
      }),
    )
    return messages
  }

  const doPullResults = async (): Promise<number> => {
    const channelId = store.getState().channel.context.channelId
    const r = await pullResults(channelId)
    for (const resp of r) {
      switch (resp.type) {
        case INPUT_STATUS: {
          const status = (resp as InputStatusResponse).inputStatus
          dispatch(updateInputStatus(status))
          break
        }
        case 'command': {
          const command = resp as CommandMessage
          currentContextId = await db.createNewContext({
            command: command.command,
            channelId,
          })
        }
      }
    }
    if (r.length > 0) {
      const dbMsg = await db.insertAllMessages(
        r.map((msg) => ({
          value: msg,
          channelId,
          contextId: currentContextId,
        })),
      )
      messages.push(...dbMsg)
      if (messages.length > MAX_BUS_MESSAGE_SIZE) {
        messages.splice(0, messages.length - BUS_MESSAGE_THRESHOLD)
      }
      for (const entry of listenerMap.entries()) {
        entry[1].onMessage?.(dbMsg)
      }
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

  function close() {
    state.isExcited = true
    if (state.pullResultsTaskId) {
      clearTimeout(state.pullResultsTaskId)
    }
    db.close()
  }

  return {
    launchPullResultTask,
    pullNow,
    addListener,
    removeListener,
    execute,
    messages,
    close,
  }
}

const useArthasMessageBus = (
  channelId: string,
): ArthasMessageBus | undefined => {
  const dispatch = useDispatch()
  const [internalBus, setInternalBus] = useState<
    ArthasMessageBusInternal | undefined
  >()

  useEffect(() => {
    let isDestroyed = false
    let myBus: ArthasMessageBusInternal | undefined
    createArthasMessageBusInternal(channelId, dispatch)
      .then((r) => {
        if (isDestroyed) {
          myBus = r
          r.close()
        } else {
          setInternalBus(r)
          r.launchPullResultTask()
        }
      })
      .catch((e) => {
        console.error(e)
      })
    return () => {
      isDestroyed = true
      if (myBus) {
        myBus.close()
      }
    }
  }, [channelId, dispatch])

  return internalBus
}

export default useArthasMessageBus
