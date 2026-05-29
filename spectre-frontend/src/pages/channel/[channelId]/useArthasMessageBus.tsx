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
  setupChannelContext,
  updateChannelContext,
  updateInputStatus,
} from '@/store/channelSlice.ts'
import { store } from '@/store'
import { useDispatch } from 'react-redux'
import type { Dispatch } from '@reduxjs/toolkit'
import setupDB, { type ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { CommandMessage } from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'
import { aggregateCommandMessages } from '@/pages/channel/[channelId]/messageAggregation.ts'
import { addToast } from '@heroui/react'
import i18n from 'i18next'

interface Listener {
  onMessage?: (messages: ArthasMessage[]) => void
  afterExecute?: (command: string, fail: boolean) => void
}

export type ArthasMessageBus = {
  addListener(listener: Listener): number
  removeListener(listenerId: number): void
  execute(command: string, interruptCurrent?: boolean): Promise<void>
  messages: ArthasMessage[]
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
const BUS_MESSAGE_THRESHOLD = 90

const createArthasMessageBusInternal = async (
  channelId: string,
  dispatch: Dispatch,
  instances: InstanceInfoVO[],
): Promise<ArthasMessageBusInternal> => {
  const listenerMap = new Map<number, Listener>()
  const db = await setupDB()
  const messages = await setupMessages()
  const contextIdByInstance = new Map<string, string>()
  const commandSeqByInstanceAndCommand = new Map<string, number>()

  await initializeInstanceContext()

  const state: PollState = {
    taskDelay: 0,
    isFetching: false,
    isExcited: false,
  }

  async function initializeInstanceContext() {
    for (const instance of instances) {
      const lastContextId = await db.findLastContextId(
        channelId,
        instance.instanceId,
      )
      if (lastContextId) {
        contextIdByInstance.set(instance.instanceId, lastContextId)
      } else {
        const initialContextId = await db.createNewContext({
          channelId,
          instanceId: instance.instanceId,
        })
        contextIdByInstance.set(instance.instanceId, initialContextId)
      }
    }

    for (const message of messages) {
      if (message.value.type !== 'command') {
        continue
      }
      const command = (message.value as CommandMessage).command
      const key = `${message.instanceId}::${command}`
      commandSeqByInstanceAndCommand.set(
        key,
        (commandSeqByInstanceAndCommand.get(key) ?? 0) + 1,
      )
    }
  }

  function refreshAggregatedMessages() {
    dispatch(
      updateChannelContext({
        messages: aggregateCommandMessages(messages),
      }),
    )
  }

  async function setupMessages() {
    const loadedMessages = await db.listAllMessages(
      channelId,
      MAX_BUS_MESSAGE_SIZE,
    )
    const instancesMap: Record<string, InstanceInfoVO> = {}
    for (const instance of instances) {
      instancesMap[instance.instanceId] = instance
    }
    if (loadedMessages.length === 0) {
      dispatch(
        setupChannelContext({
          channelId,
          inputStatus: 'DISABLED',
          instances: instancesMap,
          messages: aggregateCommandMessages(loadedMessages),
        }),
      )
      return loadedMessages
    }

    const status = await db.findLastMessage(channelId, INPUT_STATUS)
    dispatch(
      setupChannelContext({
        channelId,
        inputStatus: status
          ? (status.value as InputStatusResponse).inputStatus
          : 'ALLOW_INPUT',
        instances: instancesMap,
        messages: aggregateCommandMessages(loadedMessages),
      }),
    )
    return loadedMessages
  }

  async function ensureContextId(instanceId: string): Promise<string> {
    const existing = contextIdByInstance.get(instanceId)
    if (existing) {
      return existing
    }
    const newId = await db.createNewContext({
      channelId,
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
        dispatch(updateInputStatus(status))
      }

      if (response.type === 'command') {
        const command = (response as CommandMessage).command
        const commandSeqKey = `${instanceId}::${command}`
        const commandSequence =
          (commandSeqByInstanceAndCommand.get(commandSeqKey) ?? 0) + 1
        commandSeqByInstanceAndCommand.set(commandSeqKey, commandSequence)

        const contextId = await db.createNewContext({
          command,
          commandSequence,
          channelId: currentChannelId,
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

    console.log(result)
    for (const [instanceId, responses] of Object.entries(result)) {
      if (responses.isError) {
        addToast({
          title: i18n.t('common.error'),
          description: responses.message ?? '<Unknown>',
          color: 'danger',
        })
        continue
      }
      for (const response of responses.data!) {
        await appendMessage(instanceId, response)
      }
    }

    if (rowsToPersist.length > 0) {
      const dbMessages = await db.insertAllMessages(rowsToPersist)
      messages.push(...dbMessages)
      if (messages.length > MAX_BUS_MESSAGE_SIZE) {
        messages.splice(0, messages.length - BUS_MESSAGE_THRESHOLD)
      }
      refreshAggregatedMessages()
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

  function close() {
    state.isExcited = true
    if (state.pullResultsTaskId) {
      clearTimeout(state.pullResultsTaskId)
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
    messages.splice(0, messages.length)
    refreshAggregatedMessages()
  }

  async function deleteMessage(message: ArthasMessage) {
    const idx = messages.findIndex((msg) => msg.id === message.id)
    if (idx < 0) {
      console.error('Can not find message: ', message)
      return
    }
    await db.deleteMessage(messages[idx])
    messages.splice(idx, 1)
    refreshAggregatedMessages()
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
  const dispatch = useDispatch()
  const [internalBus, setInternalBus] = useState<
    ArthasMessageBusInternal | undefined
  >()

  useEffect(() => {
    let isDestroyed = false
    let myBus: ArthasMessageBusInternal | undefined
    createArthasMessageBusInternal(channelId, dispatch, channelInfos)
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
  }, [channelId, channelInfos, dispatch])

  return internalBus
}

export default useArthasMessageBus
