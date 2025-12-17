import React from 'react'
import type { Control } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import LabelEditor from '@/components/LabelEditor'
import { Card, CardBody, Tooltip } from '@heroui/react'
import ControlledCheckBox from '@/components/validation/ControlledCheckbox.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

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
          <div className="header-2">基础配置</div>
          <ControlledInput
            control={control}
            name="name"
            inputProps={{
              label: '名称',
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
              限制模式
            </ControlledCheckBox>
            <Tooltip
              classNames={{
                content: 'max-w-96',
              }}
              content="在限制模式下，Arthas 命令中的表达式将只能使用基础的运算符、逻辑判断以及属性访问表达式。方法调用，类引用等其它所有表达式将会完全禁用"
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
