import useGraphQL from '@/hook/useGraphQL.ts'
import { TypedDocumentString } from '@/graphql/generated/graphql.ts'

type AiEnabledQueryResult = {
  ai: {
    config: {
      enabled: boolean
    } | null
  }
}

const AiEnabledQueryDocument = new TypedDocumentString<
  AiEnabledQueryResult,
  Record<string, never>
>(`
  query AiEnabledQuery {
    ai {
      config {
        enabled
      }
    }
  }
`)

export default function useAiPanelAvailability() {
  const { result, isLoading } = useGraphQL(AiEnabledQueryDocument)
  return {
    enabled: result?.ai.config?.enabled ?? false,
    isLoading,
  }
}
