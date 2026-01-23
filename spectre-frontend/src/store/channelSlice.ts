import type { InputStatusResponse } from '@/api/impl/arthas.ts'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ChannelContext = {
  isDebugMode?: boolean
  channelId: string
  classloaderHash?: string
  inputStatus: InputStatusResponse['inputStatus']
}

interface ChannelState {
  /**
   * 保存当前界面频道上下文. 不会被持久化
   */
  context: ChannelContext
}

const initialState: ChannelState = {
  context: {
    channelId: '-1',
    inputStatus: 'DISABLED',
  },
}

export const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    setupChannelContext(state, action: PayloadAction<ChannelContext>) {
      state.context = action.payload
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

export const { setupChannelContext, updateChannelContext, updateInputStatus } =
  channelSlice.actions
export default channelSlice.reducer
