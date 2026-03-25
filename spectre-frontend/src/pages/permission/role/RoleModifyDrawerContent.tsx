import React, { useState } from 'react'
import {
  addToast,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
} from '@heroui/react'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { createRole, type RoleModifyVO, updateRole } from '@/api/impl/role.ts'
import i18n from '@/i18n'

interface RoleModifyDrawerContentProps {
  oldEntity?: RoleModifyVO
  onClose: () => void
  onSave: (newEntity: RoleModifyVO) => void
}

const RoleModifyDrawerContent: React.FC<RoleModifyDrawerContentProps> = (
  props,
) => {
  const { control, trigger, getValues } = useForm<RoleModifyVO>({
    defaultValues: props.oldEntity,
  })
  const [loading, setLoading] = useState(false)
  const isUpdate = !!props.oldEntity

  const onSave = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    setLoading(true)
    try {
      if (isUpdate) {
        await updateRole({
          id: values.id,
          name: values.name,
          description: values.description,
        })
        addToast({ title: i18n.t('common.updateSuccess'), color: 'success' })
      } else {
        await createRole(values)
        addToast({ title: i18n.t('common.createSuccess'), color: 'success' })
      }
      props.onSave({
        id: values.id,
        name: values.name,
        description: values.description,
      })
      props.onClose()
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <DrawerHeader>
        {isUpdate
          ? i18n.t(
              'hardcoded.msg_pages_permission_role_rolemodifydrawercontent_001',
            )
          : i18n.t(
              'hardcoded.msg_pages_permission_role_rolemodifydrawercontent_002',
            )}
      </DrawerHeader>
      <DrawerBody>
        <ControlledInput
          control={control}
          name="name"
          rules={{ required: !isUpdate }}
          inputProps={{
            label: i18n.t(
              'hardcoded.msg_pages_permission_role_rolemodifydrawercontent_003',
            ),
            isRequired: !isUpdate,
          }}
        />
        <ControlledInput
          control={control}
          name="description"
          inputProps={{
            label: i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_007',
            ),
          }}
        />
      </DrawerBody>
      <DrawerFooter>
        <Button
          color="danger"
          variant="light"
          disabled={loading}
          onPress={props.onClose}
        >
          Close
        </Button>
        <Button color="primary" isLoading={loading} onPress={onSave}>
          {i18n.t('common.save')}
        </Button>
      </DrawerFooter>
    </>
  )
}

export default RoleModifyDrawerContent
