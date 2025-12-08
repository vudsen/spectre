import type { AxiosResponse } from 'axios'

export type ErrorResponseVO = {
  error: true
  message: string
  code?: string
}

export type ValidationErrorResponseVO = {
  errors: {
    fieldName?: string
    message: string
  }[]
  validationError: true
}

export function isValidationError(e: unknown): e is ValidationErrorResponseVO {
  const vo = e as ValidationErrorResponseVO | undefined
  if (!vo) {
    return false
  }
  return vo.validationError
}

export function isErrorResponse(e: unknown): e is ErrorResponseVO {
  const vo = e as ErrorResponseVO | undefined
  if (!vo) {
    return false
  }
  return !!vo.message && vo.error
}

export function isAxiosResponse(data: unknown): data is AxiosResponse {
  const myData = data as AxiosResponse
  return !!myData.config && !!myData.status
}

export type PageDescriptor = {
  pageName: string
  parameters?: unknown
}
