/// <reference types="vite/client" />
interface ImportMetaEnv {
  /**
   * 后端接口 basepath
   */
  readonly VITE_API_BASE_PATH: string
  /**
   * 前端 basepath
   */
  readonly VITE_BASE_PATH: string
  /**
   * 应用版本
   */
  readonly VITE_APP_VERSION?: string
  /**
   * 是否为演示环境
   */
  readonly VITE_IS_PREVIEW_ENV?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
