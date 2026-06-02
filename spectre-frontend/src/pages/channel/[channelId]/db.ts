import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { PureArthasResponse } from '@/api/impl/arthas.ts'

const VERSION = 3

type ContextValue = {
  command?: string
  commandSequence?: number
  channelId: string
  instanceId?: string
}

type ContextValueWithPK = ContextValue & { id: string }

type MessageValue = {
  channelId: string
  contextId: string
  instanceId: string
  /**
   * Arthas message in JSON format.
   */
  value: PureArthasResponse
}

type MessageValueWithId = MessageValue & { id: string }

type ChannelInfoValue = {
  lastAccess: number
}

interface ArthasMessageDB extends DBSchema {
  messages: {
    key: string
    value: MessageValue
    indexes: { 'by-channel-id': string }
  }
  context: {
    key: string
    value: ContextValue
    indexes: {
      'by-channel-id': string
      'by-channel-instance-id': [string, string]
    }
  }
  channelInfo: {
    key: string
    value: ChannelInfoValue
  }
}

export type ArthasMessage<T extends PureArthasResponse = PureArthasResponse> = {
  id: string
  instanceId: string
  context: ContextValue
  value: T
}

const MAX_ALIVE = 1000 * 60 * 60

async function setupDB() {
  let contextId = Date.now()
  let messageId = Date.now()
  const db = await openDB<ArthasMessageDB>('ArthasMessage', VERSION, {
    upgrade(database: IDBPDatabase<ArthasMessageDB>, version) {
      if (database.objectStoreNames.contains('messages')) {
        database.deleteObjectStore('messages')
      }
      if (database.objectStoreNames.contains('context')) {
        database.deleteObjectStore('context')
      }
      if (database.objectStoreNames.contains('channelInfo')) {
        database.deleteObjectStore('channelInfo')
      }

      const messagesStore = database.createObjectStore('messages')
      messagesStore.createIndex('by-channel-id', 'channelId')

      const contextStore = database.createObjectStore('context')
      contextStore.createIndex('by-channel-id', 'channelId')
      contextStore.createIndex('by-channel-instance-id', [
        'channelId',
        'instanceId',
      ])

      database.createObjectStore('channelInfo')

      if (version <= 2) {
        database.clear('messages')
        database.clear('channelInfo')
        database.clear('context')
      }
    },
  })

  async function findAllContextByIdIn(
    ids: string[],
  ): Promise<Record<string, ContextValueWithPK>> {
    if (ids.length === 0) {
      return {}
    }
    const contexts = await Promise.all(ids.map((id) => db.get('context', id)))
    const result: Record<string, ContextValueWithPK> = {}
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i]
      if (!context) {
        continue
      }
      result[ids[i]] = {
        ...context,
        id: ids[i],
      }
    }
    return result
  }

  async function doClear(channelId: string) {
    const messageTx = db.transaction('messages', 'readwrite')
    const messageIndex = messageTx
      .objectStore('messages')
      .index('by-channel-id')

    const contextIds = new Set<string>()
    for (
      let cursor = await messageIndex.openCursor(
        IDBKeyRange.only(channelId),
        'prev',
      );
      cursor;
      cursor = await cursor.continue()
    ) {
      contextIds.add(cursor.value.contextId)
      cursor.delete()
    }

    const contextTx = db.transaction('context', 'readwrite')
    const contextStore = contextTx.objectStore('context')
    for (const id of contextIds) {
      await contextStore.delete(id)
    }

    await db.delete('channelInfo', channelId)
    await contextTx.done
    await messageTx.done
  }

  return {
    async clearUnusedMessages() {
      const tx = db.transaction('channelInfo')
      const store = tx.objectStore('channelInfo')

      const expiredChannelIds: string[] = []
      for (
        let cursor = await store.openCursor();
        cursor;
        cursor = await cursor.continue()
      ) {
        if (Date.now() - cursor.value.lastAccess >= MAX_ALIVE) {
          expiredChannelIds.push(String(cursor.primaryKey))
        }
      }
      await tx.done

      for (const channelId of expiredChannelIds) {
        await doClear(channelId)
      }
    },

    async findLastMessage(
      channelId: string,
      messageType: string,
      instanceId?: string,
    ): Promise<ArthasMessage | undefined> {
      const tx = db.transaction('messages')
      const index = tx.objectStore('messages').index('by-channel-id')

      for (
        let cursor = await index.openCursor(
          IDBKeyRange.only(channelId),
          'prev',
        );
        cursor;
        cursor = await cursor.continue()
      ) {
        if (instanceId && cursor.value.instanceId !== instanceId) {
          continue
        }
        if (cursor.value.value.type !== messageType) {
          continue
        }
        const context = await db.get('context', cursor.value.contextId)
        if (!context) {
          continue
        }
        return {
          id: String(cursor.primaryKey),
          instanceId: cursor.value.instanceId,
          context,
          value: cursor.value.value,
        }
      }

      return undefined
    },

    async listAllMessages(
      channelId: string,
      size: number,
    ): Promise<ArthasMessage[]> {
      const tx = db.transaction('messages')
      const index = tx.objectStore('messages').index('by-channel-id')

      const rawMessages: MessageValueWithId[] = []
      const contextIds = new Set<string>()

      for (
        let cursor = await index.openCursor(IDBKeyRange.only(channelId));
        cursor;
        cursor = await cursor.continue()
      ) {
        if (rawMessages.length >= size) {
          break
        }
        rawMessages.push({
          id: String(cursor.primaryKey),
          ...cursor.value,
        })
        contextIds.add(cursor.value.contextId)
      }

      const contextMap = await findAllContextByIdIn([...contextIds])
      const result: ArthasMessage[] = []
      for (const message of rawMessages) {
        const context = contextMap[message.contextId]
        if (!context) {
          continue
        }
        result.push({
          id: message.id,
          instanceId: message.instanceId,
          context,
          value: message.value,
        })
      }

      await db.put('channelInfo', { lastAccess: Date.now() }, channelId)
      await tx.done
      return result
    },

    async listDisplayMessages(
      channelId?: string,
    ): Promise<Record<string, PureArthasResponse[]>> {
      if (!channelId) {
        return {}
      }

      const tx = db.transaction('messages')
      const index = tx.objectStore('messages').index('by-channel-id')
      const result: Record<string, PureArthasResponse[]> = {}

      for (
        let cursor = await index.openCursor(IDBKeyRange.only(channelId));
        cursor;
        cursor = await cursor.continue()
      ) {
        const instanceId = cursor.value.instanceId
        if (!result[instanceId]) {
          result[instanceId] = []
        }
        result[instanceId].push(cursor.value.value)
      }

      await tx.done
      return result
    },

    async createNewContext(context: ContextValue): Promise<string> {
      const id = (++contextId).toString()
      await db.put('context', context, id)
      return id
    },

    async findLastContextId(channelId: string, instanceId?: string) {
      const tx = db.transaction('context')
      const store = tx.objectStore('context')

      if (instanceId) {
        const index = store.index('by-channel-instance-id')
        const cursor = await index.openCursor(
          IDBKeyRange.only([channelId, instanceId]),
          'prev',
        )
        return cursor?.primaryKey ? String(cursor.primaryKey) : undefined
      }

      const index = store.index('by-channel-id')
      const cursor = await index.openCursor(IDBKeyRange.only(channelId), 'prev')
      return cursor?.primaryKey ? String(cursor.primaryKey) : undefined
    },

    async insertAllMessages(
      messages: MessageValue[],
    ): Promise<ArthasMessage[]> {
      if (messages.length === 0) {
        return []
      }

      const contextIds = new Set<string>()
      const ids: string[] = []
      const updateAccessChannelIds = new Set<string>()

      for (const message of messages) {
        const id = (++messageId).toString()
        await db.put('messages', message, id)
        ids.push(id)
        contextIds.add(message.contextId)
        updateAccessChannelIds.add(message.channelId)
      }

      for (const channelId of updateAccessChannelIds) {
        await db.put('channelInfo', { lastAccess: Date.now() }, channelId)
      }

      const contextMap = await findAllContextByIdIn([...contextIds])
      const result: ArthasMessage[] = []
      for (let index = 0; index < messages.length; index++) {
        const message = messages[index]
        const context = contextMap[message.contextId]
        if (!context) {
          continue
        }
        result.push({
          id: ids[index],
          instanceId: message.instanceId,
          context,
          value: message.value,
        })
      }
      return result
    },

    close() {
      db.close()
    },

    async deleteAllMessage(channelId: string) {
      await doClear(channelId)
    },

    async deleteMessage(message: ArthasMessage) {
      await db.delete('messages', message.id)
    },
  }
}

export default setupDB
