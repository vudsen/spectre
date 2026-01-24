import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { PureArthasResponse } from '@/api/impl/arthas.ts'

const VERSION = 1

type ContextValue = {
  command?: string
  channelId: string
}
type ContextValueWithPK = ContextValue & { id: string }

type MessageValue = {
  channelId: string
  contextId: string
  /**
   * Arthas 消息，JSON格式
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
    indexes: { 'by-channel-id': string }
  }
  channelInfo: {
    /**
     * channel id
     */
    key: string
    value: ChannelInfoValue
  }
}

export type ArthasMessage<T extends PureArthasResponse = PureArthasResponse> = {
  id: string
  context: ContextValue
  value: T
}
/**
 * 1h
 */
const MAX_ALIVE = 1000 * 60 * 60

async function setupDB() {
  let contextId = Date.now()
  let messageId = Date.now()
  const db = await openDB<ArthasMessageDB>('ArthasMessage', VERSION, {
    upgrade(database: IDBPDatabase<ArthasMessageDB>) {
      const messagesStore = database.createObjectStore('messages')
      messagesStore.createIndex('by-channel-id', 'channelId')
      const contextStore = database.createObjectStore('context')
      contextStore.createIndex('by-channel-id', 'channelId')
      database.createObjectStore('channelInfo')
    },
  })

  async function findAllContextByIdIn(
    ids: string[],
  ): Promise<Record<string, ContextValueWithPK>> {
    const scopes = await Promise.all(ids.map((id) => db.get('context', id)))
    const result: Record<string, ContextValueWithPK> = {}

    for (let i = 0; i < scopes.length; i++) {
      const context = scopes[i]
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
    console.log(`Cleaning channel messages of "${channelId}"`)

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
    for (const contextId1 of contextIds) {
      await contextStore.delete(contextId1)
    }

    await db.delete('channelInfo', channelId)
    await contextTx.done
    await messageTx.done
  }

  return {
    async clearUnusedMessages() {
      const tx = db.transaction('channelInfo')
      const store = tx.objectStore('channelInfo')

      const ids: string[] = []
      for (
        let cursor = await store.openCursor();
        cursor;
        cursor = await cursor.continue()
      ) {
        if (Date.now() - cursor.value.lastAccess >= MAX_ALIVE) {
          ids.push(cursor.primaryKey)
        }
      }
      await tx.done
      for (const id of ids) {
        await doClear(id)
      }
    },
    /**
     * 找到对应类型的最后一条消息
     */
    async findLastMessage(
      channelId: string,
      messageType: string,
    ): Promise<ArthasMessage | undefined> {
      const tx = db.transaction('messages')
      const store = tx.objectStore('messages')
      const index = store.index('by-channel-id')

      for (
        let cursor = await index.openCursor(
          IDBKeyRange.only(channelId),
          'prev',
        );
        cursor;
        cursor = await cursor.continue()
      ) {
        if (cursor.value.value.type === messageType) {
          return {
            id: cursor.primaryKey,
            value: cursor.value.value,
            context: (await findAllContextByIdIn([cursor.value.contextId]))[0],
          }
        }
      }
    },
    async listAllMessages(
      channelId: string,
      size: number,
    ): Promise<ArthasMessage[]> {
      const tx = db.transaction('messages')
      const store = tx.objectStore('messages')
      const index = store.index('by-channel-id')
      const messages: MessageValueWithId[] = []
      const scopeIds = new Set<string>()
      for (
        let cursor = await index.openCursor(IDBKeyRange.only(channelId));
        cursor;
        cursor = await cursor.continue()
      ) {
        if (cursor.value.channelId !== channelId) {
          continue
        }
        if (messages.length > size) {
          break
        }
        messages.push({
          id: cursor.primaryKey,
          ...cursor.value,
        })
        scopeIds.add(cursor.value.contextId)
      }
      const contextMap = await findAllContextByIdIn([...scopeIds])
      const result: ArthasMessage<PureArthasResponse>[] = messages.map(
        (msg) => ({
          id: msg.id,
          context: contextMap[msg.contextId],
          value: msg.value,
        }),
      )
      await db.put(
        'channelInfo',
        {
          lastAccess: Date.now(),
        },
        channelId,
      )
      await tx.done
      return result
    },
    async createNewContext(context: ContextValue): Promise<string> {
      const myId = (++contextId).toString()
      await db.put('context', context, myId)
      return myId
    },
    async findLastContextId(channelId: string) {
      const tx = db.transaction('context')
      const store = tx.objectStore('context')
      const index = store.index('by-channel-id')

      const cursor = await index.openCursor(IDBKeyRange.only(channelId), 'prev')
      return cursor?.primaryKey
    },
    async insertAllMessages(
      messages: MessageValue[],
    ): Promise<ArthasMessage[]> {
      const contextIds = new Set<string>()
      const ids: string[] = []
      const updateAccessIds = new Set<string>()
      for (const message of messages) {
        const myId = (++messageId).toString()
        db.put('messages', message, myId)
        ids.push(myId)
        contextIds.add(message.contextId)
        updateAccessIds.add(message.channelId)
      }
      for (const updateAccessId of updateAccessIds) {
        await db.put(
          'channelInfo',
          {
            lastAccess: Date.now(),
          },
          updateAccessId,
        )
      }
      const contextMap = await findAllContextByIdIn([...contextIds])
      return messages.map((message, index) => ({
        id: ids[index],
        context: contextMap[message.contextId],
        value: message.value,
      }))
    },
    close() {
      db.close()
    },
  }
}

export default setupDB
