import React from 'react'
import type { Control } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import LabelEditor from '@/components/LabelEditor'
import { Card, CardBody, Tooltip } from '@heroui/react'
import ControlledCheckBox from '@/components/validation/ControlledCheckbox.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import i18n from '@/i18n'

type Values = {
  name: string
  // unused in this component, but required.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: any
  labels: Record<string, string>
  restrictedMode: boolean
}

interface RuntimeNodeBasicInputsProps {
  control: Control<Values>
}

const RuntimeNodeBasicInputs: React.FC<RuntimeNodeBasicInputsProps> = ({
  control,
}) => {
  return (
    <>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">
            {i18n.t('hardcoded.msg_components_runtimenodebasicinputs_001')}
          </div>
          <ControlledInput
            control={control}
            name="name"
            inputProps={{
              label: i18n.t('hardcoded.msg_components_labeleditor_index_004'),
              isRequired: true,
            }}
          />
          <div className="flex items-center">
            <ControlledCheckBox
              control={control}
              name="restrictedMode"
              checkboxProps={{
                className: 'mr-0.5',
              }}
            >
              {i18n.t('hardcoded.msg_components_runtimenodebasicinputs_002')}
            </ControlledCheckBox>
            <Tooltip
              classNames={{
                content: 'max-w-96',
              }}
              content={i18n.t(
                'hardcoded.msg_components_runtimenodebasicinputs_003',
              )}
            >
              <SvgIcon icon={Icon.QUESTION} size={20} />
            </Tooltip>
          </div>
        </CardBody>
      </Card>
      <LabelEditor control={control} name="labels" />
    </>
  )
}

export default RuntimeNodeBasicInputs
