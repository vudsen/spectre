import type {
  AskHumanRequest,
  PendingAskHumanState,
} from '@/pages/channel/[channelId]/_ai/types.ts'

const AI_CONVERSATION_KEY_PREFIX = 'spectre.ai.conversation'

function createConversationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function getConversationStorageKey(channelId: string): string {
  return `${AI_CONVERSATION_KEY_PREFIX}.${channelId}`
}

export function getOrCreateConversationId(channelId: string): string {
  const key = getConversationStorageKey(channelId)
  const oldVal = sessionStorage.getItem(key)
  if (oldVal) {
    return oldVal
  }
  const next = createConversationId()
  sessionStorage.setItem(key, next)
  return next
}

export function resetConversationId(channelId: string): string {
  const key = getConversationStorageKey(channelId)
  const next = createConversationId()
  sessionStorage.setItem(key, next)
  return next
}

export function parseAskHumanRequest(
  parameter: string | null | undefined,
  data: string,
): PendingAskHumanState {
  const fallback: AskHumanRequest = {
    question: data,
  }

  if (!parameter) {
    return fallback
  }

  try {
    const parsed = JSON.parse(parameter) as {
      question?: unknown
    }
    const question =
      typeof parsed.question === 'string' && parsed.question.trim().length > 0
        ? parsed.question
        : data
    return {
      question,
    }
  } catch {
    return fallback
  }
}
