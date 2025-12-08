import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios, { AxiosError } from 'axios'
import { handleError, showDialog } from '@/common/util.ts'
import { isErrorResponse, isValidationError } from '@/api/types.ts'
import { store } from '@/store'
import { clearUserInfo } from '@/store/sessionSlice'

type ErrorInfo = {
  title: string
  message: string
}

function handleResponse0(
  body: unknown,
  status: number,
  errorMessage?: string,
  meta?: AxiosRequestConfig['meta'],
): AxiosResponse<unknown> | Promise<AxiosResponse<unknown>> {
  let errorInfo: ErrorInfo | undefined = undefined
  console.log('1')
  if (status === 401) {
    showDialog({
      title: '请先登录',
      message: '是否跳转到登录页面',
      onConfirm: () => {
        store.dispatch(clearUserInfo())
        location.replace(`${import.meta.env.VITE_BASE_PATH}/login`)
      },
    })
    return Promise.reject(new Error('会话失效'))
  }
  if (isErrorResponse(body)) {
    errorInfo = {
      title: '请求失败',
      message: body.message,
    }
  } else if (isValidationError(body)) {
    const msg = ['表单校验失败']
    for (const va of body.errors) {
      if (va.fieldName) {
        msg.push(`[${va.fieldName}]${va.message}`)
      } else {
        msg.push(` ${va.message}`)
      }
    }
    errorInfo = {
      title: '表单校验失败',
      message: msg.join(';'),
    }
  } else if (errorMessage) {
    errorInfo = {
      title: '请求失败',
      message: errorMessage,
    }
  }
  if (errorInfo) {
    if (!meta?.skipErrorHandler) {
      handleError(errorInfo.message, errorInfo.title)
    }
    return Promise.reject(new Error(errorInfo.message))
  }
  return body as unknown as AxiosResponse
}

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_PATH
axios.interceptors.response.use(
  (response) => {
    return handleResponse0(
      response.data,
      response.status,
      undefined,
      response.config.meta,
    )
  },
  (error) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(new Error(error.message))
    }
    return handleResponse0(
      error.response?.data,
      error.status ?? 200,
      error.message ?? '<Unknown>',
      error.config?.meta,
    )
  },
)
