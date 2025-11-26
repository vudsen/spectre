import type { TypedDocumentString } from './generated/graphql'
import { showDialog } from '@/common/util.ts'

type QLError = {
  extensions: {
    classification: string
  }
  locations: Array<{
    column: number
    line: number
  }>
  message: string
  path: string[]
}

type QLResponse<T> = {
  data: T
  errors?: QLError[]
}

export class GraphQLError extends Error {
  errors: string[]

  constructor(errors: QLError[]) {
    super('Graphql Error: ' + errors.map((e) => e.message).join(';'))
    this.errors = errors.map((e) => e.message)
  }
}

const compressGraphQL = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
): string =>
  query
    .replace(/#.*/g, '') // 删除注释
    .replace(/\s+/g, ' ') // 压缩多余空格
    .replace(/\s*([{}():,])\s*/g, '$1') // 去掉符号周围空格
    .trim()

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const response = await fetch('/spectre-api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
    },
    body: JSON.stringify({
      query: compressGraphQL(query),
      variables,
    }),
  })

  if (response.status === 401) {
    showDialog({
      title: '请先登录',
      message: '是否跳转到登录页面',
      onConfirm: () => {
        location.replace(`${import.meta.env.VITE_BASE_PATH}/login`)
      },
    })
    return Promise.reject(new Error('会话过期'))
  }
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const result = await (response.json() as Promise<QLResponse<TResult>>)

  if (result.errors) {
    return Promise.reject(new GraphQLError(result.errors))
  }
  return result.data
}

export type DocumentResult<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends TypedDocumentString<infer R, any> ? R : never
