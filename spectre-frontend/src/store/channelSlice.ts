import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type UpdateRecord = {
  channelId: string
  /**
   * 上次更新时间
   */
  lastUpdate: number
}

type ChannelContext = {
  isDebugMode?: boolean
  channelId: string
  classloaderHash?: string
}

interface ChannelState {
  /**
   * channel id -> 缓存的消息
   */
  messages: Record<string, ArthasResponseWithId[]>
  /**
   * 记录上次更新时间，并删除长时间不更新的记录
   */
  updates: Record<string, UpdateRecord>
  /**
   * 保存当前界面频道上下文
   */
  context: ChannelContext
  /**
   * 增强功能菜单是否开启
   */
  isMenuOpen: boolean
}

const initialState: ChannelState = {
  messages: {},
  updates: {},
  context: {
    channelId: '-1',
  },
  isMenuOpen: true,
}

type AppendMessagePayload = {
  channelId: string
  messages: ArthasResponseWithId[]
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
      const newMessage: Record<string, ArthasResponseWithId[]> = {}
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
    setupChannelContext(state) {
      state.context = {
        channelId: '-1',
      }
    },
    updateChannelContext(
      state,
      action: PayloadAction<Partial<ChannelContext>>,
    ) {
      state.context = {
        ...state.context,
        ...action.payload,
      }
    },
    setEnhanceMenuOpen(state, action: PayloadAction<boolean>) {
      state.isMenuOpen = action.payload
    },
  },
})

export const {
  clearExpiredMessages,
  appendMessages,
  setupChannelContext,
  updateChannelContext,
  setEnhanceMenuOpen,
} = channelSlice.actions
export default channelSlice.reducer
