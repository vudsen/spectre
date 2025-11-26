import axios, { AxiosError, type AxiosResponse } from 'axios'
import { handleError, showDialog } from '@/common/util.ts'
import { isErrorResponse, isValidationError } from '@/api/types.ts'
import { store } from '@/store'
import { clearUserInfo } from '@/store/sessionSlice'

function handleResponse(
  response: AxiosResponse,
  error?: AxiosError,
): AxiosResponse | Promise<AxiosResponse> {
  const data = response.data
  if (isErrorResponse(data)) {
    handleError(data.message, '请求失败')
    return Promise.reject(data)
  } else if (isValidationError(data)) {
    const msg = ['表单校验失败']
    for (const va of data.errors) {
      if (va.fieldName) {
        msg.push(`[${va.fieldName}]${va.message}`)
      } else {
        msg.push(` ${va.message}`)
      }
    }
    handleError(msg.join(';'), '表单校验失败')
    return Promise.reject(data)
  }
  if (!error) {
    return data
  }
  handleError(error, '请求失败')
  return Promise.reject(new Error(error.message))
}

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_PATH
axios.interceptors.response.use(
  (response) => {
    return handleResponse(response)
  },
  (error) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(new Error(error.message))
    }
    if (error.status === 401) {
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

    if (error.config?.meta?.skipErrorHandler) {
      return Promise.reject(error.response?.data)
    }
    if (!error.response) {
      handleError(error, '请求失败')
      return Promise.reject(error)
    }
    return handleResponse(error.response, error)
  },
)
