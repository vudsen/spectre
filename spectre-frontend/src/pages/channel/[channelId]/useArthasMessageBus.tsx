import {
  createArthasResultWebSocket,
  type ArthasPullResultEvent,
  type ArthasPullResultsRequest,
  type ArthasResultWebSocketEvent,
  type InstanceInfoVO,
  executeArthasCommand,
  type InputStatusResponse,
  interruptCommand,
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
import { showDialog } from '@/common/util.ts'
import i18n from '@/i18n'

interface Listener {
  onMessage?: (messages: ArthasMessage[]) => void
  afterExecute?: (command: string, fail: boolean) => void
}

type DisplayMessages = (
  pretty?: boolean,
) => Promise<Record<string, ArthasMessage[]>>

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
  pullResultsTaskId?: number
  reconnectTaskId?: number
  websocket?: WebSocket
  isSocketOpen: boolean
  lastPullSentAt: number
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
const MAX_PULL_DELAY = 20 * 1000
const INITIAL_PULL_DELAY = 1000
const SOCKET_RECONNECT_DELAY = 1000
const MIN_PULL_INTERVAL = 1000

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
    taskDelay: INITIAL_PULL_DELAY,
    isExcited: false,
    isSocketOpen: false,
    lastPullSentAt: 0,
  }

  registerDisplayMessages()

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
    const instanceMap: Record<string, InstanceStatus> = {}
    for (const instance of instances) {
      const instanceMessages = await db.listAllMessages(
        instance.instanceId,
        MAX_BUS_MESSAGE_SIZE,
      )
      r[instance.instanceId] = instanceMessages
      const status: InstanceStatus = {
        ...instance,
        inputStatus: 'DISABLED',
      }
      for (let i = instanceMessages.length - 1; i >= 0; i--) {
        const msg = instanceMessages[i]
        if (msg.value.type === INPUT_STATUS) {
          status.inputStatus = (msg.value as InputStatusResponse).inputStatus
          break
        }
      }
      instanceMap[instance.instanceId] = status
    }
    store.dispatch(
      setupChannelContext({
        channelId,
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

  async function persistResponses(
    rows: {
      instanceId: string
      response: PureArthasResponse
    }[],
  ): Promise<number> {
    const currentChannelId = store.getState().channel.context.channelId
    const rowsToPersist: {
      value: PureArthasResponse
      channelId: string
      contextId: string
      instanceId: string
    }[] = []

    for (const row of rows) {
      const response = row.response
      if (response.type === INPUT_STATUS) {
        const status = (response as InputStatusResponse).inputStatus
        store.dispatch(
          updateInputStatus({
            [row.instanceId]: status,
          }),
        )
      }

      if (response.type === 'command') {
        const command = (response as CommandMessage).command
        const contextId = await db.createNewContext({
          command,
          instanceId: row.instanceId,
        })
        contextIdByInstance.set(row.instanceId, contextId)
      }

      const contextId = await ensureContextId(row.instanceId)
      rowsToPersist.push({
        value: response,
        channelId: currentChannelId,
        contextId,
        instanceId: row.instanceId,
      })
    }

    if (rowsToPersist.length === 0) {
      return 0
    }

    const dbMessages = await db.insertAllMessages(rowsToPersist)
    const newMessageMap: Record<string, ArthasMessage[]> = {}
    for (const instance of instances) {
      newMessageMap[instance.instanceId] = []
    }
    for (const dbMessage of dbMessages) {
      newMessageMap[dbMessage.instanceId].push(dbMessage)
      messages[dbMessage.instanceId].push(dbMessage)
    }

    store.dispatch(
      updateChannelContext({
        groupedMessages: aggregator.appendNewMessages(
          store.getState().channel.context.groupedMessages,
          newMessageMap,
        ),
      }),
    )
    for (const entry of listenerMap.entries()) {
      entry[1].onMessage?.(dbMessages)
    }
    return rowsToPersist.length
  }

  function clearPullTimer() {
    if (state.pullResultsTaskId) {
      clearTimeout(state.pullResultsTaskId)
      state.pullResultsTaskId = undefined
    }
  }

  function clearReconnectTimer() {
    if (state.reconnectTaskId) {
      clearTimeout(state.reconnectTaskId)
      state.reconnectTaskId = undefined
    }
  }

  function scheduleNextPull(delay: number) {
    if (state.isExcited) {
      return
    }
    clearPullTimer()
    state.pullResultsTaskId = setTimeout(() => {
      launchPullResultTask()
    }, delay)
  }

  async function handlePullResultEvent(event: ArthasPullResultEvent) {
    await persistResponses(
      event.messages.map((response) => ({
        instanceId: event.instanceId,
        response,
      })),
    )
    state.taskDelay = 0
    scheduleNextPull(state.taskDelay)
  }

  async function handleSocketMessage(raw: string) {
    const event = JSON.parse(raw) as ArthasResultWebSocketEvent
    if (event.type === 'pull_result') {
      await handlePullResultEvent(event)
    }
  }

  function openSocket() {
    return new Promise<void>((resolve, reject) => {
      if (
        state.isExcited ||
        state.websocket?.readyState === WebSocket.OPEN ||
        state.websocket?.readyState === WebSocket.CONNECTING
      ) {
        resolve()
        return
      }

      clearReconnectTimer()
      let websocket: WebSocket
      try {
        websocket = createArthasResultWebSocket(channelId)
      } catch (e) {
        reject(e)
        return
      }
      state.websocket = websocket

      websocket.onopen = function () {
        state.isSocketOpen = true
        state.taskDelay = INITIAL_PULL_DELAY
        pullNow()
        resolve()
      }

      websocket.onmessage = (event) => {
        handleSocketMessage(String(event.data)).catch((error) => {
          console.error(error)
        })
      }

      websocket.onclose = () => {
        state.isSocketOpen = false
        state.websocket = undefined
        console.log('websocket closed')
        if (!state.isExcited) {
          clearReconnectTimer()
          state.reconnectTaskId = setTimeout(() => {
            openSocket()
          }, SOCKET_RECONNECT_DELAY)
        }
      }

      websocket.onerror = function (event) {
        console.error(event)
        showDialog({
          title: i18n.t('channel.establishFailed'),
          message: i18n.t('common.seeConsole'),
          color: 'danger',
          hideCancel: true,
        })
        if (this.readyState !== WebSocket.OPEN) {
          reject()
        }
      }
    })
  }

  const launchPullResultTask = () => {
    if (state.isExcited) {
      return
    }
    if (
      !state.websocket ||
      !state.isSocketOpen ||
      state.websocket.readyState !== WebSocket.OPEN
    ) {
      openSocket()
      scheduleNextPull(Math.max(state.taskDelay, SOCKET_RECONNECT_DELAY))
      return
    }

    const now = Date.now()
    const elapsed = now - state.lastPullSentAt
    // 避免后端同时发送多条结果，导致前端多次触发 pullNow
    if (elapsed < MIN_PULL_INTERVAL) {
      scheduleNextPull(MIN_PULL_INTERVAL - elapsed)
      return
    }

    const payload: ArthasPullResultsRequest = {
      type: 'pull_results',
    }
    state.websocket.send(JSON.stringify(payload))
    state.lastPullSentAt = now
    state.taskDelay = Math.min(state.taskDelay + 1000, MAX_PULL_DELAY)
    scheduleNextPull(state.taskDelay)
  }

  const pullNow = () => {
    state.taskDelay = 0
    clearPullTimer()
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

    const interruptable = Object.entries(context.instances).filter(
      ([_, v]) => v.inputStatus === 'ALLOW_INTERRUPT',
    )

    if (interruptCurrent && interruptable.length > 0) {
      await interruptCommand(currentChannelId, {
        instanceIds: interruptable.map((it) => it[1].instanceId),
      })
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
      const result = await executeArthasCommand(currentChannelId, finalCommand)
      const instanceMap = store.getState().channel.context.instances
      const failMsgArr: string[] = []
      let totalLen = 0
      for (const [instanceId, exec] of Object.entries(result)) {
        totalLen++
        if (exec.success) {
          continue
        }
        failMsgArr.push(instanceMap[instanceId].jvmName + ': ' + exec.message)
      }
      if (failMsgArr.length > 0) {
        showDialog({
          title: `${i18n.t('channel.batchExecFail')} (${totalLen - failMsgArr.length}/${totalLen})`,
          message: (
            <div className="flex flex-col">
              <div>{i18n.t('channel.batchExecDesc')}</div>
              {failMsgArr.map((msg, index) => (
                <div key={index}>- {msg}</div>
              ))}
            </div>
          ),
          color: 'danger',
          hideCancel: true,
        })
      }
      if (failMsgArr.length !== totalLen) {
        pullNow()
      }
      fail = false
    } finally {
      for (const entry of listenerMap.entries()) {
        entry[1].afterExecute?.(command, fail)
      }
    }
  }

  function registerDisplayMessages() {
    window.displayMessages = async (pretty) => {
      const instanceIds = Object.keys(
        store.getState().channel.context.instances,
      )
      console.info('Exporting...')
      const resultMap: Record<string, ArthasMessage[]> = {}
      for (const instanceId of instanceIds) {
        resultMap[instanceId] = await db.listAllMessages(instanceId, 100)
      }
      if (pretty) {
        const prettyResult: Record<string, PureArthasResponse[]> = {}
        for (const [k, v] of Object.entries(resultMap)) {
          prettyResult[k] = v.map((msg) => ({
            // resort field
            // @ts-expect-error when field not exist
            type: msg.value.type,
            // @ts-expect-error when field not exist
            jobId: msg.value.jobId,
            ...msg.value,
          }))
        }
        console.log(prettyResult)
      } else {
        console.log(resultMap)
      }
      return resultMap
    }
  }

  function close() {
    state.isExcited = true
    clearPullTimer()
    clearReconnectTimer()
    if (state.websocket && state.websocket.readyState === WebSocket.OPEN) {
      state.websocket.close()
      state.websocket = undefined
    }
    db.close()
  }

  function cleanExpiredMessage() {
    db.clearUnusedMessages().catch((e) => {
      console.error('Failed to clean unused message', e)
    })
  }

  async function clearAllMessage() {
    await Promise.all(
      Object.keys(messages).map((instanceId) =>
        db.deleteAllMessage(instanceId),
      ),
    )
    for (const key of Object.keys(messages)) {
      messages[key] = []
    }
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

  await openSocket()

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
        myBus = r
        if (isDestroyed) {
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
