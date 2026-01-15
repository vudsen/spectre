import type {
  ArthasResponseWithId,
  InputStatusResponse,
} from '@/api/impl/arthas.ts'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ChannelContext = {
  isDebugMode?: boolean
  channelId: string
  classloaderHash?: string
  inputStatus: InputStatusResponse['inputStatus']
}

interface ChannelState {
  /**
   * channel id -> 缓存的消息
   */
  messages: Record<string, ArthasResponseWithId[]>
  /**
   * 记录上次更新时间，并删除长时间不更新的记录
   */
  updates: Record<string, number>
  /**
   * 保存当前界面频道上下文. 不会被持久化
   */
  context: ChannelContext
}

const initialState: ChannelState = {
  messages: {},
  updates: {},
  context: {
    channelId: '-1',
    inputStatus: 'DISABLED',
  },
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
      state.updates[payload.channelId] = Date.now()
    },
    clearExpiredMessages(state) {
      const newMessage: Record<string, ArthasResponseWithId[]> = {}
      const newUpdates: Record<string, number> = {}
      Object.entries(state.updates).forEach(([k, v]) => {
        if (Date.now() - v < 1000 * 60 * 30) {
          newMessage[k] = state.messages[k]
          newUpdates[k] = v
        }
      })
      state.messages = newMessage
      state.updates = newUpdates
    },
    setupChannelContext(state, action: PayloadAction<{ channelId: string }>) {
      const messages = state.messages[action.payload.channelId] ?? []
      let inputStatus: InputStatusResponse['inputStatus'] = 'DISABLED'
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.type === 'input_status') {
          inputStatus = (msg as InputStatusResponse).inputStatus
          break
        }
      }
      state.context = {
        channelId: action.payload.channelId,
        inputStatus,
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
    updateInputStatus(
      state,
      action: PayloadAction<InputStatusResponse['inputStatus']>,
    ) {
      state.context.inputStatus = action.payload
    },
  },
})

export const {
  clearExpiredMessages,
  appendMessages,
  setupChannelContext,
  updateChannelContext,
  updateInputStatus,
} = channelSlice.actions
export default channelSlice.reducer
