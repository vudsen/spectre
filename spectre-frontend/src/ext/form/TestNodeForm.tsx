import React from 'react'
import type { FormComponentProps } from '@/ext/type.ts'
import {
  createRuntimeNode,
  type RuntimeNodeDTO,
  updateRuntimeNode,
} from '@/api/impl/runtime-node.ts'
import RuntimeNodeBasicInputs from '@/components/RuntimeNodeBasicInputs.tsx'
import { useForm } from 'react-hook-form'
import { addToast, Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import i18n from '@/i18n'

type Values = {
  name: string
  labels: Record<string, string>
  configuration: unknown
  restrictedMode: boolean
}

const TestNodeForm: React.FC<FormComponentProps> = ({
  onSubmit,
  oldState: myOldState,
  pluginId,
}) => {
  const { t } = useTranslation()
  const { control, trigger, getValues } = useForm<Values>()
  const oldState = myOldState as RuntimeNodeDTO | undefined
  const nav = useNavigate()

  const save = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (oldState) {
      await updateRuntimeNode({
        ...oldState,
        ...values,
        configuration: {},
      })

      addToast({
        title: t('common.updateSuccess'),
        color: 'success',
      })
    } else {
      await createRuntimeNode({
        ...values,
        pluginId,
        configuration: {},
      })
      addToast({
        title: t('common.createSuccess'),
        color: 'success',
      })
    }
    onSubmit?.(values)
    nav('/runtime-node/list')
  }

  return (
    <div className="spectre-container">
      <div className="spectre-heading">
        {oldState
          ? i18n.t('hardcoded.msg_ext_form_k8sconfform_005')
          : i18n.t('hardcoded.msg_ext_form_testnodeform_001')}
        {i18n.t('hardcoded.msg_ext_form_testnodeform_002')}
      </div>
      <RuntimeNodeBasicInputs control={control} />
      <div className="flex flex-row-reverse">
        <Button onPress={save} color="primary">
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export default TestNodeForm
