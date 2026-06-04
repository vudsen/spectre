import {
  type InstanceInfoVO,
  executeArthasCommand,
  type InputStatusResponse,
  interruptCommand,
  pullResults,
  type PureArthasResponse,
} from '@/api/impl/arthas.ts'
import { useEffect, useState } from 'react'
import {
  type InstanceStatus,
  setupChannelContext,
  updateChannelContext,
  updateInputStatus,
} from '@/store/channelSlice.ts'
import { store } from '@/store'
import setupDB, { type ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { CommandMessage } from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'
import { createMessageAggregator } from '@/pages/channel/[channelId]/messageAggregation.ts'

interface Listener {
  onMessage?: (messages: ArthasMessage[]) => void
  afterExecute?: (command: string, fail: boolean) => void
}

type DisplayMessages = (channelId?: string) => void

declare global {
  interface Window {
    displayMessages?: DisplayMessages
  }
}

export type ArthasMessageBus = {
  addListener(listener: Listener): number
  removeListener(listenerId: number): void
  execute(command: string, interruptCurrent?: boolean): Promise<void>
  messages: Record<string, ArthasMessage[]>
  clearAllMessage(): Promise<void>
  deleteMessage(message: ArthasMessage): Promise<void>
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
  cleanExpiredMessage: () => void
} & ArthasMessageBus

const classloaderHashRegx = /-c +[\da-zA-Z]{8}/
const INPUT_STATUS = 'input_status'
const MAX_BUS_MESSAGE_SIZE = 100

function parseChannelIdFromPathname(pathname: string): string | undefined {
  return /\/channel\/([^/]+)/.exec(pathname)?.[1]
}

const createArthasMessageBusInternal = async (
  channelId: string,
  instances: InstanceInfoVO[],
): Promise<ArthasMessageBusInternal> => {
  const aggregator = createMessageAggregator(instances)
  const listenerMap = new Map<number, Listener>()
  const db = await setupDB()
  const messages = await setupMessages()
  const contextIdByInstance = new Map<string, string>()

  await initializeInstanceContext()

  const state: PollState = {
    taskDelay: 0,
    isFetching: false,
    isExcited: false,
  }

  if (import.meta.env.DEV) {
    registerDisplayMessages()
  }

  async function initializeInstanceContext() {
    for (const instance of instances) {
      const lastContextId = await db.findLastContextId(instance.instanceId)
      if (lastContextId) {
        contextIdByInstance.set(instance.instanceId, lastContextId)
      } else {
        const initialContextId = await db.createNewContext({
          instanceId: instance.instanceId,
        })
        contextIdByInstance.set(instance.instanceId, initialContextId)
      }
    }
  }

  function refreshAggregatedMessages() {}

  async function setupMessages(): Promise<Record<string, ArthasMessage[]>> {
    const r: Record<string, ArthasMessage[]> = {}
    let inputStatus: InputStatusResponse['inputStatus'] = 'DISABLED'
    const instanceMap: Record<string, InstanceStatus> = {}
    for (const instance of instances) {
      const messages = await db.listAllMessages(
        instance.instanceId,
        MAX_BUS_MESSAGE_SIZE,
      )
      r[instance.instanceId] = messages
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.value.type === INPUT_STATUS) {
          inputStatus = (msg.value as InputStatusResponse).inputStatus
          break
        }
      }
      instanceMap[instance.instanceId] = {
        ...instance,
        inputStatus,
      }
    }
    store.dispatch(
      setupChannelContext({
        channelId,
        inputStatus,
        instances: instanceMap,
        groupedMessages: aggregator.appendNewMessages([], r),
      }),
    )
    return r
  }

  async function ensureContextId(instanceId: string): Promise<string> {
    const existing = contextIdByInstance.get(instanceId)
    if (existing) {
      return existing
    }
    const newId = await db.createNewContext({
      instanceId,
    })
    contextIdByInstance.set(instanceId, newId)
    return newId
  }

  const doPullResults = async (): Promise<number> => {
    const currentChannelId = store.getState().channel.context.channelId
    const result = await pullResults(currentChannelId)

    const rowsToPersist: {
      value: PureArthasResponse
      channelId: string
      contextId: string
      instanceId: string
    }[] = []

    const appendMessage = async (
      instanceId: string,
      response: PureArthasResponse,
    ) => {
      if (response.type === INPUT_STATUS) {
        const status = (response as InputStatusResponse).inputStatus
        store.dispatch(updateInputStatus(status))
      }

      if (response.type === 'command') {
        const command = (response as CommandMessage).command
        const contextId = await db.createNewContext({
          command,
          instanceId,
        })
        contextIdByInstance.set(instanceId, contextId)
      }

      const contextId = await ensureContextId(instanceId)
      rowsToPersist.push({
        value: response,
        channelId: currentChannelId,
        contextId,
        instanceId,
      })
    }

    for (const [instanceId, responses] of Object.entries(result)) {
      for (const response of responses) {
        await appendMessage(instanceId, response)
      }
    }
    console.log(rowsToPersist.length)
    if (rowsToPersist.length > 0) {
      const dbMessages = await db.insertAllMessages(rowsToPersist)
      const newMessageMap: Record<string, ArthasMessage[]> = {}
      for (const instance of instances) {
        newMessageMap[instance.instanceId] = []
      }
      for (const dbMessage of dbMessages) {
        newMessageMap[dbMessage.instanceId].push(dbMessage)
        messages[dbMessage.instanceId].push(dbMessage)
      }

      console.log('dispatched.')
      try {
        store.dispatch(
          updateChannelContext({
            groupedMessages: aggregator.appendNewMessages(
              store.getState().channel.context.groupedMessages,
              newMessageMap,
            ),
          }),
        )
      } catch (e) {
        console.error(e)
      }
      for (const entry of listenerMap.entries()) {
        entry[1].onMessage?.(dbMessages)
      }
    }
    return rowsToPersist.length
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
      .catch(() => {
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
    const currentChannelId = context.channelId
    if (interruptCurrent && context.inputStatus === 'ALLOW_INTERRUPT') {
      await interruptCommand(currentChannelId)
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
      await executeArthasCommand(currentChannelId, finalCommand)
      pullNow()
      fail = false
    } finally {
      for (const entry of listenerMap.entries()) {
        entry[1].afterExecute?.(command, fail)
      }
    }
  }

  function registerDisplayMessages() {
    const fallbackChannelId =
      parseChannelIdFromPathname(window.location.pathname) ?? channelId

    window.displayMessages = (requestedChannelId) => {
      const resolvedChannelId =
        requestedChannelId ??
        parseChannelIdFromPathname(window.location.pathname) ??
        fallbackChannelId

      console.info('Exporting...')

      if (!resolvedChannelId) {
        console.warn('No data from the channelId')
        return
      }

      db.listDisplayMessages(resolvedChannelId)
        .then((groupedMessages) => {
          console.log(groupedMessages)
        })
        .catch((error) => {
          console.error('Failed to export', error)
        })
    }
  }

  function close() {
    state.isExcited = true
    if (state.pullResultsTaskId) {
      clearTimeout(state.pullResultsTaskId)
    }
    if (import.meta.env.DEV) {
      delete window.displayMessages
    }
    db.close()
  }

  function cleanExpiredMessage() {
    db.clearUnusedMessages().catch((e) => {
      console.error('Failed to clean unused message', e)
    })
  }

  async function clearAllMessage() {
    await db.deleteAllMessage(channelId)
    for (const key of Object.keys(messages)) {
      messages[key] = []
    }
    aggregator.clear()
    refreshAggregatedMessages()
    store.dispatch(
      updateChannelContext({
        groupedMessages: [],
      }),
    )
  }

  async function deleteMessage(arthasMessage: ArthasMessage) {
    const target = messages[arthasMessage.instanceId]
    const idx = target.findIndex((msg) => msg.id === arthasMessage.id)
    if (idx < 0) {
      console.error('Can not find message: ', arthasMessage)
      return
    }
    await db.deleteMessage(arthasMessage)
    target.splice(idx, 1)
    const messageGroups = store.getState().channel.context.groupedMessages
    for (const group of messageGroups) {
      const arr = group.instances[arthasMessage.instanceId]
      if (!arr) {
        continue
      }
      const t = arr.findIndex((msg) => msg.id === arthasMessage.id)
      if (t >= 0) {
        arr.splice(t, 1)
        break
      }
    }
    store.dispatch(
      updateChannelContext({
        groupedMessages: [...messageGroups],
      }),
    )
  }

  return {
    launchPullResultTask,
    pullNow,
    addListener,
    removeListener,
    execute,
    messages,
    close,
    cleanExpiredMessage,
    clearAllMessage,
    deleteMessage,
  }
}

const useArthasMessageBus = (
  channelId: string,
  channelInfos: InstanceInfoVO[],
): ArthasMessageBus | undefined => {
  const [internalBus, setInternalBus] = useState<
    ArthasMessageBusInternal | undefined
  >()

  useEffect(() => {
    let isDestroyed = false
    let myBus: ArthasMessageBusInternal | undefined
    createArthasMessageBusInternal(channelId, channelInfos)
      .then((r) => {
        if (isDestroyed) {
          myBus = r
          r.close()
        } else {
          setInternalBus(r)
          r.cleanExpiredMessage()
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
  }, [channelId, channelInfos])

  return internalBus
}

export default useArthasMessageBus
