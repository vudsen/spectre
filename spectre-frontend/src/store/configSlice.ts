import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ConfigState = {
  /**
   * 是否启用 skills
   */
  useAiSkills?: boolean
}

const initialState: ConfigState = {}

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateConfig(state, action: PayloadAction<Partial<ConfigState>>) {
      Object.assign(state, action.payload)
    },
  },
})

export const { updateConfig } = configSlice.actions
export default configSlice.reducer
