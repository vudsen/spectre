import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UserInfo = {
  username: string
  userId: string
}

interface SessionState {
  user?: UserInfo
}

const initialState: SessionState = {}

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    saveUserInfo(state, action: PayloadAction<UserInfo>) {
      state.user = action.payload
    },
    clearUserInfo(state) {
      state.user = undefined
    },
  },
})

export const { saveUserInfo, clearUserInfo } = sessionSlice.actions
export default sessionSlice.reducer
