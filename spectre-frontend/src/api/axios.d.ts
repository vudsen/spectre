// axios.d.ts
import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * 自定义元数据，用于拦截器逻辑控制
     */
    meta?: {
      skipErrorHandler?: boolean
      authRequired?: boolean
    }
  }
}
