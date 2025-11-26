import React from 'react'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'

type MyLabel = {
  key: string
  value: string
}

interface LabelModifyModalContentProps {
  label?: MyLabel
  onModify: (label: MyLabel) => void
  onClose: () => void
}

const LabelModifyModalContent: React.FC<LabelModifyModalContentProps> = (
  props,
) => {
  const { control, trigger, getValues } = useForm<MyLabel>({
    defaultValues: props.label,
  })
  const isUpdate = !!props.label

  const onSave = async () => {
    if (!(await trigger())) {
      return
    }
    const val = getValues()
    props.onModify(val)
    props.onClose()
  }
  return (
    <>
      <ModalHeader>{isUpdate ? '更新标签' : '新增标签'}</ModalHeader>
      <ModalBody>
        <ControlledInput
          control={control}
          name="key"
          rules={{ required: true }}
          inputProps={{
            isDisabled: isUpdate,
            label: '名称',
            required: true,
          }}
        />
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="value"
          inputProps={{
            label: '值',
            required: true,
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="flat" onPress={props.onClose}>
          关闭
        </Button>
        <Button color="primary" onPress={onSave}>
          保存
        </Button>
      </ModalFooter>
    </>
  )
}

export default LabelModifyModalContent
