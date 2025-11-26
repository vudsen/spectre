import type { TypedDocumentString } from '@/graphql/generated/graphql.ts'
import { useEffect, useState } from 'react'
import { execute, GraphQLError } from '@/graphql/execute.ts'
import { handleError } from '@/common/util.ts'

interface UseGraphQLReturnType<TResult> {
  isLoading: boolean
  result?: TResult
  errors: string[]
}

const useGraphQL = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): UseGraphQLReturnType<TResult> => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TResult>()
  const [errors, setErrors] = useState<string[]>([])
  useEffect(() => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    execute(query, variables)
      .then((r) => {
        setResult(r)
      })
      .catch((e) => {
        if (e instanceof GraphQLError) {
          setErrors(e.errors)
        } else if (e instanceof Error) {
          setErrors([e.message])
        }
        console.error(e)
        handleError(e)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query, variables])

  return {
    isLoading: loading,
    result,
    errors,
  }
}

export default useGraphQL
