import type { InputStatusResponse, InstanceInfoVO } from '@/api/impl/arthas.ts'
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { SkillDTO } from '@/api/impl/ai.ts'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { RootState } from '@/store/index.ts'

export type AggregatedCommandGroup = {
  command: string
  instances: Record<string, ArthasMessage[]>
}

export type InstanceStatus = {
  inputStatus: InputStatusResponse['inputStatus']
} & InstanceInfoVO

type ChannelContext = {
  isDebugMode?: boolean
  channelId: string
  classloaderHash?: string
  selectedSkill?: SkillDTO
  availableSkills?: SkillDTO[]
  instances: Record<string, InstanceStatus>
  groupedMessages: AggregatedCommandGroup[]
  /**
   * 自动执行 LLM 工具执行请求
   */
  autoConfirm?: boolean
  isBatch?: boolean
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
    instances: {},
    groupedMessages: [],
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
      { payload }: PayloadAction<Partial<ChannelContext>>,
    ) {
      state.context = {
        ...state.context,
        ...payload,
      }
    },
    updateInputStatus(
      state,
      action: PayloadAction<Record<string, InputStatusResponse['inputStatus']>>,
    ) {
      for (const [instanceId, status] of Object.entries(action.payload)) {
        state.context.instances[instanceId].inputStatus = status
      }
    },
  },
})

const selectChannel = (state: RootState) => state.channel

export const selectInputStatus = createSelector([selectChannel], (state) => {
  const instances = state.context.instances
  for (const value of Object.values(instances)) {
    if (value.inputStatus === 'ALLOW_INTERRUPT') {
      return 'ALLOW_INTERRUPT'
    }
  }
  return 'ALLOW_INPUT'
})

export const { setupChannelContext, updateChannelContext, updateInputStatus } =
  channelSlice.actions
export default channelSlice.reducer
