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
        addToast({ title: '更新成功', color: 'success' })
      } else {
        await createRole(values)
        addToast({ title: '创建成功', color: 'success' })
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
      <DrawerHeader>{isUpdate ? '更新角色' : '新增角色'}</DrawerHeader>
      <DrawerBody>
        <ControlledInput
          control={control}
          name="name"
          rules={{ required: !isUpdate }}
          inputProps={{ label: '角色名称', isRequired: !isUpdate }}
        />
        <ControlledInput
          control={control}
          name="description"
          inputProps={{
            label: '描述',
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
          保存
        </Button>
      </DrawerFooter>
    </>
  )
}

export default RoleModifyDrawerContent
