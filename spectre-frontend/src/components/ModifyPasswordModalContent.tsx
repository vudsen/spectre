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
import i18n from '@/i18n'

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
      setError('newPassword1', {
        message: i18n.t(
          'hardcoded.msg_components_modifypasswordmodalcontent_001',
        ),
      })
      return
    }
    setLoading(true)
    try {
      await props.modifyPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      addToast({
        title: i18n.t(
          'hardcoded.msg_components_modifypasswordmodalcontent_002',
        ),
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
      <ModalHeader>
        {i18n.t('hardcoded.msg_components_modifypasswordmodalcontent_003')}
      </ModalHeader>
      <ModalBody>
        {props.showOldPasswordInput ? (
          <ControlledInput
            control={control}
            name="oldPassword"
            rules={{ required: true }}
            inputProps={{
              label: i18n.t(
                'hardcoded.msg_components_modifypasswordmodalcontent_004',
              ),
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
            label: i18n.t(
              'hardcoded.msg_components_modifypasswordmodalcontent_005',
            ),
            type: 'password',
            isRequired: true,
          }}
        />
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="newPassword1"
          inputProps={{
            label: i18n.t(
              'hardcoded.msg_components_modifypasswordmodalcontent_006',
            ),
            type: 'password',
            isRequired: true,
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" isDisabled={loading} onPress={props.onClose}>
          {i18n.t(
            'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_002',
          )}
        </Button>
        <Button color="primary" onPress={onSubmit} isLoading={loading}>
          {i18n.t('hardcoded.msg_components_modifypasswordmodalcontent_007')}
        </Button>
      </ModalFooter>
    </>
  )
}

export default ModifyPasswordModalContent
