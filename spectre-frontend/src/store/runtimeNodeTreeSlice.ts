import type { JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type RuntimeNodeTreeState = {
  batchSelectedNodes: JvmTreeNodeDTO[]
  currentSelect?: JvmTreeNodeDTO
  searchContent: string
}
const initialState: RuntimeNodeTreeState = {
  batchSelectedNodes: [],
  searchContent: '',
}

type OnBatchSelectPayload = {
  node: JvmTreeNodeDTO
  select: boolean
}

export const runtimeNodeTreeSlice = createSlice({
  name: 'runtimeNodeTree',
  initialState,
  reducers: {
    onBatchSelect(state, action: PayloadAction<OnBatchSelectPayload>) {
      const idx = state.batchSelectedNodes.findIndex(
        (item) => action.payload.node.id === item.id,
      )
      if (action.payload.select) {
        if (idx < 0) {
          state.batchSelectedNodes.push(action.payload.node)
        } else {
          return
        }
      } else {
        if (idx < 0) {
          return
        } else {
          state.batchSelectedNodes.splice(idx, 1)
          return
        }
      }
    },
    setCurrentSelected(state, action: PayloadAction<JvmTreeNodeDTO>) {
      state.currentSelect = action.payload
    },
    updateSearchContent(state, action: PayloadAction<string>) {
      state.searchContent = action.payload
    },
  },
})

export const { onBatchSelect, setCurrentSelected, updateSearchContent } =
  runtimeNodeTreeSlice.actions
export default runtimeNodeTreeSlice.reducer
