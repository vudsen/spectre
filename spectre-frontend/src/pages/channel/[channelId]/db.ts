import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { PureArthasResponse } from '@/api/impl/arthas.ts'

const VERSION = 5

type ContextValue = {
  command?: string
  instanceId?: string
}

type ContextValueWithPK = ContextValue & { id: string }

type MessageValue = {
  contextId: string
  instanceId: string
  /**
   * Arthas message in JSON format.
   */
  value: PureArthasResponse
}

type MessageValueWithId = MessageValue & { id: string }

type InstanceInfoValue = {
  lastAccess: number
}

interface ArthasMessageDB extends DBSchema {
  messages: {
    key: string
    value: MessageValue
    indexes: { 'by-instance-id': string }
  }
  context: {
    key: string
    value: ContextValue
    indexes: {
      'by-instance-id': [string, string]
    }
  }
  instanceInfo: {
    key: string
    value: InstanceInfoValue
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
      if (version <= VERSION) {
        database.clear('messages')
        // @ts-expect-error remove legacy data
        database.clear('channelInfo')
        database.clear('context')
      }
      if (database.objectStoreNames.contains('messages')) {
        database.deleteObjectStore('messages')
      }
      if (database.objectStoreNames.contains('context')) {
        database.deleteObjectStore('context')
      }
      // @ts-expect-error remove legacy data
      if (database.objectStoreNames.contains('channelInfo')) {
        // @ts-expect-error remove legacy data
        database.deleteObjectStore('channelInfo')
      }

      const messagesStore = database.createObjectStore('messages')
      messagesStore.createIndex('by-instance-id', 'instanceId')

      const contextStore = database.createObjectStore('context')
      contextStore.createIndex('by-instance-id', 'instanceId')

      database.createObjectStore('instanceInfo')
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

  async function doClear(instanceId: string) {
    const messageTx = db.transaction('messages', 'readwrite')
    const messageIndex = messageTx
      .objectStore('messages')
      .index('by-instance-id')

    const contextIds = new Set<string>()
    for (
      let cursor = await messageIndex.openCursor(
        IDBKeyRange.only(instanceId),
        'prev',
      );
      cursor;
      cursor = await cursor.continue()
    ) {
      contextIds.add(cursor.value.contextId)
      cursor.delete().catch((e) => {
        console.error(e)
      })
    }

    const contextTx = db.transaction('context', 'readwrite')
    const contextStore = contextTx.objectStore('context')
    for (const id of contextIds) {
      await contextStore.delete(id)
    }

    await db.delete('instanceInfo', instanceId)
    await contextTx.done
    await messageTx.done
  }

  return {
    async clearUnusedMessages() {
      const tx = db.transaction('instanceInfo')
      const store = tx.objectStore('instanceInfo')

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

    async listAllMessages(
      instanceId: string,
      size: number,
    ): Promise<ArthasMessage[]> {
      const tx = db.transaction('messages')
      const index = tx.objectStore('messages').index('by-instance-id')

      const rawMessages: MessageValueWithId[] = []
      const contextIds = new Set<string>()

      for (
        let cursor = await index.openCursor(
          IDBKeyRange.only(instanceId),
          'prev',
        );
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
      // 返回出去的得按时间升序
      for (let i = rawMessages.length - 1; i >= 0; i--) {
        const message = rawMessages[i]
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

      await db.put('instanceInfo', { lastAccess: Date.now() }, instanceId)
      await tx.done
      return result
    },

    async createNewContext(context: ContextValue): Promise<string> {
      const id = (++contextId).toString()
      await db.put('context', context, id)
      return id
    },

    async findLastContextId(instanceId: string) {
      const tx = db.transaction('context')
      const store = tx.objectStore('context')

      const index = store.index('by-instance-id')
      const cursor = await index.openCursor(
        IDBKeyRange.only([instanceId]),
        'prev',
      )
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
      const updateAccessInstanceIds = new Set<string>()

      for (const message of messages) {
        const id = (++messageId).toString()
        await db.put('messages', message, id)
        ids.push(id)
        contextIds.add(message.contextId)
        updateAccessInstanceIds.add(message.instanceId)
      }

      for (const instanceId of updateAccessInstanceIds) {
        await db.put('instanceInfo', { lastAccess: Date.now() }, instanceId)
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
