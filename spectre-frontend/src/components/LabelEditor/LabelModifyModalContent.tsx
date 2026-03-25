import React from 'react'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import i18n from '@/i18n'

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
      <ModalHeader>
        {isUpdate
          ? i18n.t(
              'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_001',
            )
          : i18n.t('hardcoded.msg_components_labeleditor_index_002')}
      </ModalHeader>
      <ModalBody>
        <ControlledInput
          control={control}
          name="key"
          rules={{ required: true }}
          inputProps={{
            isDisabled: isUpdate,
            label: i18n.t('hardcoded.msg_components_labeleditor_index_004'),
            required: true,
          }}
        />
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="value"
          inputProps={{
            label: i18n.t('hardcoded.msg_components_labeleditor_index_005'),
            required: true,
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="flat" onPress={props.onClose}>
          {i18n.t(
            'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_002',
          )}
        </Button>
        <Button color="primary" onPress={onSave}>
          {i18n.t('common.save')}
        </Button>
      </ModalFooter>
    </>
  )
}

export default LabelModifyModalContent
