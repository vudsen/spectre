import type React from 'react'

export type FormComponentRef = {
  /**
   * 校验表单并返回具体数据. 返回空表示校验失败
   */
  collect: () => Promise<Record<string, unknown> | undefined>
}

export interface FormComponentProps {
  /**
   * 提交事件
   */
  onSubmit?: (data: unknown) => void
  /**
   * 旧数据
   */
  oldState?: unknown
  pluginId: string
  ref?: React.RefObject<FormComponentRef | null>
}

/**
 * 表单专用组件
 */
export type FormPage = React.ComponentType<FormComponentProps>

export interface ViewComponentProps {
  data: unknown
}

/**
 * 展示类组件
 */
export type ViewComponent = React.ComponentType<ViewComponentProps>
