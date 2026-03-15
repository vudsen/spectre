import axios from 'axios'

export type LLMConfigurationDTO = {
  id?: number
  provider: string
  model: string
  baseUrl?: string
  apiKey?: string
  maxTokenPerHour: number
  enabled: boolean
}

export type LLMConfigurationModifyVO = {
  id?: number
  provider: string
  model: string
  baseUrl?: string
  apiKey?: string
  maxTokenPerHour: number
  enabled: boolean
}

export const queryCurrentLLMConfiguration =
  (): Promise<LLMConfigurationDTO | null> => axios.get('ai/llm-config/current')

export const saveLLMConfiguration = (
  vo: LLMConfigurationModifyVO,
): Promise<LLMConfigurationDTO> => axios.post('ai/llm-config', vo)

export type AiMessageType =
  | 'TOKEN'
  | 'TOOL_CALL_START'
  | 'PENDING_CONFIRM'
  | 'TOOL_CALL_END'
  | 'ASK_HUMAN'
  | 'ERROR'

export type AiMessageDTO = {
  type: AiMessageType
  data: string
  parameter?: string | null
}

export type AiChatRequestVO = {
  query: string
  channelId: string
  conversationId: string
}

interface ChatByAiStreamHandlers {
  onMessage?: (msg: AiMessageDTO) => void
  onDone?: () => void
  signal?: AbortSignal
}

function resolveApiUrl(path: string): string {
  const basePath = String(import.meta.env.VITE_API_BASE_PATH || '')
  if (basePath.startsWith('http://') || basePath.startsWith('https://')) {
    return `${basePath.replace(/\/$/, '')}/${path}`
  }
  return `${basePath.replace(/\/$/, '')}/${path}`
}

function parseSseDataBlock(block: string): string | null {
  const lines = block.split(/\r?\n/)
  const dataLines: string[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line || line.startsWith(':')) {
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) {
    return null
  }
  return dataLines.join('\n')
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) {
    return `AI chat request failed with status ${response.status}`
  }
  try {
    const body = JSON.parse(text) as { message?: string }
    return body.message || text
  } catch {
    return text
  }
}

export async function chatByAiStream(
  request: AiChatRequestVO,
  handlers: ChatByAiStreamHandlers = {},
  withSkills: boolean,
): Promise<void> {
  const response = await fetch(
    resolveApiUrl(withSkills ? 'ai/chat/with-skill' : 'ai/chat'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      credentials: 'include',
      body: JSON.stringify(request),
      signal: handlers.signal,
    },
  )

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  if (!response.body) {
    handlers.onDone?.()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const chunk = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const payload = parseSseDataBlock(chunk)
        if (payload) {
          handlers.onMessage?.(JSON.parse(payload) as AiMessageDTO)
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
    const remain = buffer.trim()
    if (remain) {
      const payload = parseSseDataBlock(remain)
      if (payload) {
        handlers.onMessage?.(JSON.parse(payload) as AiMessageDTO)
      }
    }
    handlers.onDone?.()
  } finally {
    reader.releaseLock()
  }
}
