import type { ArthasResponse } from '@/api/impl/arthas.ts'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type UpdateRecord = {
  channelId: string
  /**
   * 上次更新时间
   */
  lastUpdate: number
}

interface ChannelState {
  /**
   * channel id -> 缓存的消息
   */
  messages: Record<string, ArthasResponse[]>
  /**
   * 记录上次更新时间，并删除长时间不更新的记录
   */
  updates: Record<string, UpdateRecord>
}

const initialState: ChannelState = {
  messages: {},
  updates: {},
}

type AppendMessagePayload = {
  channelId: string
  messages: ArthasResponse[]
}

export const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    /**
     * 追加消息
     */
    appendMessages(state, action: PayloadAction<AppendMessagePayload>) {
      const payload = action.payload
      const messagesTarget = state.messages[payload.channelId]
      if (messagesTarget) {
        messagesTarget.push(...payload.messages)
      } else {
        state.messages[payload.channelId] = payload.messages
      }
      const updateTarget = state.updates[payload.channelId]
      if (updateTarget) {
        updateTarget.lastUpdate = Date.now()
      } else {
        state.updates[payload.channelId] = {
          lastUpdate: Date.now(),
          channelId: payload.channelId,
        }
      }
    },
    clearExpiredMessages(state) {
      const newMessage: Record<string, ArthasResponse[]> = {}
      const newUpdates: Record<string, UpdateRecord> = {}
      Object.entries(state.updates).forEach(([k, v]) => {
        if (Date.now() - v.lastUpdate < 1000 * 60 * 30) {
          newMessage[k] = state.messages[k]
          newUpdates[k] = v
        }
      })
      state.messages = newMessage
      state.updates = newUpdates
    },
  },
})

export const { clearExpiredMessages, appendMessages } = channelSlice.actions
export default channelSlice.reducer
