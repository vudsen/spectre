import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/**
 * 保存一些界面提示，当值为 true 后，将不再提醒
 */
type TipState = {
  channelRightClickMenuTip?: boolean
}

const initialState: TipState = {}

export const tipSlice = createSlice({
  name: 'tip',
  initialState,
  reducers: {
    setTipRead(state, action: PayloadAction<Partial<TipState>>) {
      Object.assign(state, action.payload)
    },
  },
})

export const { setTipRead } = tipSlice.actions
export default tipSlice.reducer
