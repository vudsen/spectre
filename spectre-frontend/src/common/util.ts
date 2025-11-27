import { addToast } from '@heroui/react'
import { getDialogQueue } from '@/components/DialogProvider/dialogQueue.ts'
import type { DialogConfig } from '@/components/DialogProvider/ConfirmDialog.tsx'
import { isErrorResponse, isValidationError } from '@/api/types.ts'
import type { UseFormSetError, FieldPath, FieldValues } from 'react-hook-form'

export const showDialog = (config: DialogConfig) => {
  getDialogQueue().addElement(config)
}

export const handleError = (e: unknown, title: string = '错误') => {
  let msg: string | undefined
  if (e instanceof Error) {
    msg = e.message
  } else if (typeof e === 'string') {
    msg = e
  } else if (isErrorResponse(e)) {
    msg = e.message
  }
  if (msg) {
    addToast({
      title,
      description: msg,
      color: 'danger',
    })
  } else {
    showDialog({
      title,
      message: 'Unknown error: ' + JSON.stringify(e),
      color: 'danger',
    })
    console.error(e)
  }
}

function ensureSize(num: number): string {
  if (num < 10) {
    return '0' + num
  }
  return num.toString(10)
}

export const formatTime = (time: number | string): string => {
  if (typeof time === 'string') {
    time = Number.parseInt(time, 10)
  }
  const date = new Date(time)
  return `${date.getFullYear()}/${ensureSize(date.getMonth() + 1)}/${ensureSize(date.getDate())} ${ensureSize(date.getHours())}:${ensureSize(date.getMinutes())}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPromise = <T = unknown>(value: any): value is Promise<T> =>
  !!value &&
  typeof value === 'object' &&
  typeof value.then === 'function' &&
  typeof value.catch === 'function'

/**
 * 尝试将 ValidationError 的错误显示到表单中
 */
export const tryApplyValidationError = <TFieldValues extends FieldValues>(
  e: unknown,
  setError: UseFormSetError<TFieldValues>,
) => {
  if (!isValidationError(e)) {
    return
  }
  for (const error of e.errors) {
    if (error.fieldName) {
      setError(error.fieldName as FieldPath<TFieldValues>, {
        message: error.message,
      })
    }
  }
}
