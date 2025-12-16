import React, { useState } from 'react'
import type { FormComponentProps } from '@/ext/type.ts'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { addToast, Alert, Button, Card, CardBody } from '@heroui/react'
import {
  createRuntimeNode,
  type RuntimeNodeDTO,
  updateRuntimeNode,
} from '@/api/impl/runtime-node.ts'
import { useNavigate } from 'react-router'
import ControlledCheckbox from '@/components/validation/ControlledCheckbox.tsx'
import RuntimeNodeBasicInputs from '@/components/RuntimeNodeBasicInputs.tsx'

type K8sRuntimeNodeConfig = {
  apiServerEndpoint: string
  token: string
  spectreHome?: string
  insecure: boolean
}

type Values = {
  name: string
  labels: Record<string, string>
  restrictedMode: boolean
  configuration: K8sRuntimeNodeConfig
}

const ANONYMOUS_PASSWORD = '******'

const K8sConfForm: React.FC<FormComponentProps> = (props) => {
  const { control, getValues, trigger } = useForm<Values>({
    defaultValues: async () => {
      const oldState = props.oldState as RuntimeNodeDTO
      const conf = JSON.parse(oldState.configuration) as Omit<
        K8sRuntimeNodeConfig,
        'name'
      >
      return {
        name: oldState.name,
        labels: oldState.labels,
        configuration: {
          apiServerEndpoint: conf.apiServerEndpoint,
          insecure: conf.insecure,
          spectreHome: conf.spectreHome,
          token: ANONYMOUS_PASSWORD,
        },
        restrictedMode: oldState.restrictedMode,
      } satisfies Values
    },
  })
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const onSave = async () => {
    if (!(await trigger())) {
      return
    }
    setLoading(true)
    try {
      const values = getValues()
      if (props.oldState) {
        const oldState = props.oldState as RuntimeNodeDTO
        await updateRuntimeNode({
          id: oldState.id,
          name: values.name,
          pluginId: props.pluginId,
          labels: values.labels,
          configuration: {
            ...values.configuration,
            token:
              values.configuration.token === ANONYMOUS_PASSWORD
                ? undefined
                : values.configuration.token,
          },
        })
      } else {
        await createRuntimeNode(
          values.name,
          props.pluginId,
          values.labels,
          values.configuration,
        )
      }
      addToast({
        title: props.oldState ? '更新成功' : '创建成功',
        color: 'success',
      })
      nav('/runtime-node/list')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-3 px-5">
      <div className="header-1">Kubernetes</div>
      <RuntimeNodeBasicInputs control={control} />
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">连接设置</div>
          <Alert color="warning" variant="faded">
            目前仅支持 Token 认证
          </Alert>
          <ControlledInput
            name="configuration.apiServerEndpoint"
            inputProps={{
              isRequired: true,
              label: 'Endpoint',
              placeholder: '请输入 Api Server 端点',
              type: 'url',
            }}
            control={control}
            rules={{ required: true }}
          />
          <ControlledInput
            name="configuration.token"
            inputProps={{
              isRequired: true,
              label: 'Token',
              type: 'password',
            }}
            control={control}
            rules={{ required: true }}
          />
          <ControlledInput
            name="configuration.spectreHome"
            inputProps={{
              isRequired: true,
              label: 'Spectre Home',
              defaultValue: '/opt/spectre',
            }}
            control={control}
            rules={{ required: true }}
          />
          <ControlledCheckbox
            checkboxProps={{}}
            control={control}
            name="configuration.insecure"
          >
            忽略 SSL 校验
          </ControlledCheckbox>
        </CardBody>
      </Card>
      <div className="flex flex-row-reverse">
        <Button
          variant="light"
          color="primary"
          isLoading={loading}
          onPress={onSave}
        >
          {props.oldState ? '更新' : '保存'}
        </Button>
      </div>
    </div>
  )
}

export default K8sConfForm
