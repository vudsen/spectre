import axios from 'axios'

export type LLMConfigurationDTO = {
  id?: number
  provider: string
  model: string
  baseUrl?: string
  apiKey?: string
  enabled: boolean
}

export type LLMConfigurationModifyVO = {
  id?: number
  provider: string
  model: string
  baseUrl?: string
  apiKey?: string
  enabled: boolean
}

export const queryCurrentLLMConfiguration =
  (): Promise<LLMConfigurationDTO | null> => axios.get('ai/llm-config/current')

export const saveLLMConfiguration = (
  vo: LLMConfigurationModifyVO,
): Promise<LLMConfigurationDTO> => axios.post('ai/llm-config', vo)
