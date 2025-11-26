import React, { useState } from 'react'
import {
  addToast,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { useForm } from 'react-hook-form'
import { tryApplyValidationError } from '@/common/util.ts'

interface ModifyPasswordModalContentProps {
  onClose: () => void
  modifyPassword: (values: ModifyPasswordData) => Promise<unknown>
  onModified?: () => void
  userId: string
  showOldPasswordInput?: boolean
}

export type ModifyPasswordData = {
  oldPassword?: string
  newPassword: string
}

type Values = {
  oldPassword: string
  newPassword: string
  newPassword1: string
}

const ModifyPasswordModalContent: React.FC<ModifyPasswordModalContentProps> = (
  props,
) => {
  const { control, trigger, getValues, setError } = useForm<Values>()
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (values.newPassword !== values.newPassword1) {
      setError('newPassword1', { message: '两次输入的密码不一致' })
      return
    }
    setLoading(true)
    try {
      await props.modifyPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      addToast({
        title: '修改密码成功',
        color: 'success',
      })
      props.onModified?.()
      props.onClose()
    } catch (e) {
      tryApplyValidationError(e, setError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ModalHeader>修改密码</ModalHeader>
      <ModalBody>
        {props.showOldPasswordInput ? (
          <ControlledInput
            control={control}
            name="oldPassword"
            rules={{ required: true }}
            inputProps={{
              label: '旧密码',
              type: 'password',
              isRequired: true,
            }}
          />
        ) : null}
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="newPassword"
          inputProps={{
            label: '新密码',
            type: 'password',
            isRequired: true,
          }}
        />
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="newPassword1"
          inputProps={{
            label: '确认密码',
            type: 'password',
            isRequired: true,
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" isDisabled={loading} onPress={props.onClose}>
          关闭
        </Button>
        <Button color="primary" onPress={onSubmit} isLoading={loading}>
          修改
        </Button>
      </ModalFooter>
    </>
  )
}

export default ModifyPasswordModalContent
