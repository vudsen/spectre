import { type FormComponentProps } from '@/ext/type.ts'
import React, { useState } from 'react'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import SteppedPanel from '@/components/SteppedPanel/SteppedPanel.tsx'
import SteppedPanelItem from '@/components/SteppedPanel/SteppedPanelItem.tsx'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Tab,
  Tabs,
  Tooltip,
} from '@heroui/react'
import {
  useForm,
  type UseFormReturn,
  useWatch,
  type Control,
} from 'react-hook-form'
import {
  createRuntimeNode,
  type RuntimeNodeDTO,
  testConnection,
  updateRuntimeNode,
} from '@/api/impl/runtime-node.ts'
import { handleError } from '@/common/util.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { useNavigate } from 'react-router'
import ControlledCheckbox from '@/components/validation/ControlledCheckbox.tsx'
import ControlledTextarea from '@/components/validation/ControlledTextarea.tsx'
import classnames from '@/components/SpectreTabs/styles.ts'
import RuntimeNodeBasicInputs from '@/components/RuntimeNodeBasicInputs.tsx'

type Values = {
  name: string
  labels: Record<string, string>
  configuration: SshRuntimeNodeConfig
  restrictedMode: boolean
}

type SshRuntimeNodeConfig = {
  host: string
  port: number
  username: string
  principal?: LoginPrincipal
  docker: {
    enabled: boolean
    executablePath?: string
    javaHome?: string
    spectreHome?: string
  }
  local: {
    enabled: boolean
    javaHome: string
  }
  spectreHome: string
}

type LoginPrincipal = {
  loginType: string
  password?: string
  secretKey?: string
  secretKeyPassword?: string
}

interface ConfigurationForm2Props {
  toPreviousPage: () => void
  pluginId: string
  /**
   * 若提供，则进行更新
   */
  runtimeNodeId?: string
  formControl: UseFormReturn<Values>
}

const ANONYMOUS_PASSWORD = '********'

function removeAnonymousPassword(principal?: LoginPrincipal) {
  if (!principal) {
    return
  }
  if (principal.password === ANONYMOUS_PASSWORD) {
    principal.password = undefined
  }
  if (principal.secretKey === ANONYMOUS_PASSWORD) {
    principal.secretKeyPassword = undefined
  }
}

const ConfigurationForm2: React.FC<ConfigurationForm2Props> = (props) => {
  const { control, trigger, getValues } = props.formControl
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const isDockerEnabled = useWatch<Values>({
    control,
    name: 'configuration.docker.enabled',
  }) as boolean | undefined

  const isLocalEnabled = useWatch<Values>({
    control,
    name: 'configuration.local.enabled',
  }) as boolean | undefined

  const onSubmit = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    setLoading(true)
    try {
      const configuration = values.configuration
      removeAnonymousPassword(configuration.principal)
      if (configuration.local) {
        configuration.local.enabled = !!isLocalEnabled
      }
      if (configuration.docker) {
        configuration.docker.enabled = !!isDockerEnabled
      }

      if (props.runtimeNodeId) {
        await updateRuntimeNode({
          ...values,
          id: props.runtimeNodeId,
          pluginId: props.pluginId,
          configuration,
        })
        addToast({
          title: '更新成功',
          color: 'success',
        })
      } else {
        await createRuntimeNode({
          ...values,
          pluginId: props.pluginId,
          configuration,
        })
        addToast({
          title: '创建成功',
          color: 'success',
        })
      }
      nav('/runtime-node/list')
    } catch (e) {
      handleError(e, '修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="space-y-5">
        <div className="header-1">SSH-高级配置</div>
        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">Spectre 设置</div>
            <div className="text-sm">该板块允许你配置 Spectre 的具体特性。</div>
            <div className="text-xl font-semibold">本地</div>
            <div>
              <div className="flex flex-row items-center">
                <ControlledCheckbox
                  control={control}
                  name="configuration.local.enabled"
                  checkboxProps={{
                    classNames: { base: 'mr-0.5' },
                  }}
                >
                  启用
                </ControlledCheckbox>
                <Tooltip content="是否连接远程服务器本地的 JVM">
                  <SvgIcon icon={Icon.QUESTION} size={24} />
                </Tooltip>
              </div>
              {isLocalEnabled ? (
                <div className="my-3 space-y-3">
                  <ControlledInput
                    control={control}
                    name="configuration.local.javaHome"
                    inputProps={{
                      label: 'Java Home',
                      placeholder:
                        'Java Home, 不填时默认使用 Path 下的 Java 工具',
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="text-xl font-semibold">Docker</div>
            <div>
              <div className="flex flex-row items-center">
                <ControlledCheckbox
                  control={control}
                  name="configuration.docker.enabled"
                  checkboxProps={{
                    classNames: { base: 'mr-0.5' },
                  }}
                >
                  启用
                </ControlledCheckbox>
                <Tooltip content="是否连接远程服务器 Docker 中的 JVM">
                  <SvgIcon icon={Icon.QUESTION} size={24} />
                </Tooltip>
              </div>
              {isDockerEnabled ? (
                <div className="my-3 space-y-3">
                  <ControlledInput
                    control={control}
                    name="configuration.docker.spectreHome"
                    rules={{ required: true }}
                    inputProps={{
                      label: 'Spectre Home',
                      defaultValue: '/opt/spectre',
                      isRequired: true,
                    }}
                  />
                  <ControlledInput
                    control={control}
                    name="configuration.docker.executablePath"
                    inputProps={{
                      label: 'Docker Path',
                      placeholder:
                        'Docker 可执行文件的路径， 不填时默认使用 Path 下的 Docker',
                    }}
                  />
                  <ControlledInput
                    control={control}
                    name="configuration.docker.javaHome"
                    inputProps={{
                      label: 'Java Home',
                      placeholder:
                        'Java Home, 不填时默认使用 Path 下的 Java 工具',
                    }}
                  />
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>
        <div className="flex flex-row-reverse">
          <Button
            variant="light"
            color="primary"
            onPress={onSubmit}
            isLoading={loading}
          >
            {props.runtimeNodeId ? '更新' : '创建'}
          </Button>
          <Button
            variant="light"
            onPress={props.toPreviousPage}
            isDisabled={loading}
          >
            上一步
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TabFormProps {
  control: Control<Values>
}

const PasswordLoginForm: React.FC<TabFormProps> = (props) => {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">密码连接</div>
        <div className="text-sm">使用密码直接连接。</div>
        <ControlledInput
          control={props.control}
          name="configuration.principal.password"
          inputProps={{
            label: '密码',
            type: 'password',
            isRequired: true,
          }}
        />
      </CardBody>
    </Card>
  )
}

const SshKeyLoginForm: React.FC<TabFormProps> = (props) => {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">使用 SSH Key 登录</div>
        <div className="text-sm">
          使用 SSH Key 登录。目前支持 Open SSH 和 RSA 秘钥。
        </div>
        <ControlledTextarea
          control={props.control}
          name="configuration.principal.secretKey"
          inputProps={{
            label: 'SecretKey',
            isRequired: true,
          }}
        />
        <ControlledInput
          control={props.control}
          name="configuration.principal.secretKeyPassword"
          inputProps={{
            label: 'SecretKey Password',
            type: 'password',
          }}
        />
      </CardBody>
    </Card>
  )
}

const NoAuthorizationLoginForm: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <div className="header-2">无认证</div>
        <div className="text-sm">
          无认证，直接使用用户名登录。如果您配置了 SSH 免密登录，可以使用该选项
        </div>
      </CardBody>
    </Card>
  )
}

const SshConfForm: React.FC<FormComponentProps> = (props) => {
  const [page, setPage] = useState(0)

  const oldState = props.oldState as RuntimeNodeDTO | undefined
  const configuration = oldState?.configuration as
    | SshRuntimeNodeConfig
    | undefined
  const formControl = useForm<Values>({
    defaultValues: oldState
      ? {
          name: oldState.name,
          labels: oldState.labels,
          restrictedMode: oldState.restrictedMode,
          configuration: {
            host: configuration?.host,
            principal: {
              loginType: configuration?.principal?.loginType ?? 'NONE',
              password: ANONYMOUS_PASSWORD,
              secretKey: ANONYMOUS_PASSWORD,
              secretKeyPassword: configuration?.principal?.secretKeyPassword,
            },
            port: configuration?.port,
            username: configuration?.username,
            docker: {
              ...configuration?.docker,
            },
            local: {
              ...configuration?.local,
            },
          },
        }
      : {
          configuration: {
            principal: {
              loginType: 'PASSWORD',
            },
          },
        },
  })
  const { control, trigger, getValues, setValue } = formControl
  const [loading, setLoading] = useState(false)

  const onConnectConfFinish = async () => {
    const b = await trigger()
    if (!b) {
      return
    }
    setLoading(true)
    try {
      const values = getValues()
      removeAnonymousPassword(values.configuration.principal)
      const r = await testConnection(
        props.pluginId,
        values.configuration,
        oldState?.id,
      )
      if (r) {
        handleError(r, '测试失败')
      } else {
        setPage(1)
      }
    } finally {
      setLoading(false)
    }
  }

  const onLoginTypeChange = (key: string | number) => {
    if (typeof key === 'string') {
      setValue('configuration.principal.loginType', key)
    }
  }

  return (
    <div>
      <SteppedPanel page={page} className="px-5">
        <SteppedPanelItem>
          <div className="space-y-3">
            <div className="header-1">SSH</div>
            <RuntimeNodeBasicInputs control={control} />
            <Card>
              <CardBody className="space-y-3">
                <div className="header-2 font-semibold">连接设置</div>
                <div className="text-sm">远程服务器基础设置</div>
                <ControlledInput
                  name="configuration.host"
                  inputProps={{ isRequired: true, label: 'Host' }}
                  control={control}
                  rules={{ required: true }}
                />
                <ControlledInput
                  name="configuration.port"
                  inputProps={{
                    isRequired: true,
                    type: 'number',
                    defaultValue: '22',
                    label: 'Port',
                  }}
                  control={control}
                  rules={{ required: true }}
                />
                <ControlledInput
                  name="configuration.username"
                  inputProps={{ isRequired: true, label: '用户名' }}
                  control={control}
                  rules={{ required: true }}
                />
                <ControlledInput
                  control={control}
                  name="configuration.spectreHome"
                  rules={{ required: true }}
                  inputProps={{
                    isRequired: true,
                    defaultValue: '/opt/spectre',
                    label: 'Spectre 数据目录',
                  }}
                />
              </CardBody>
            </Card>
            <Tabs
              defaultSelectedKey={configuration?.principal?.loginType}
              onSelectionChange={onLoginTypeChange}
              aria-label="Login Type Tabs"
              classNames={classnames}
              variant="underlined"
            >
              <Tab key="PASSWORD" title="密码认证">
                <PasswordLoginForm control={control} />
              </Tab>
              <Tab key="KEY" title="SSH Key 认证">
                <SshKeyLoginForm control={control} />
              </Tab>
              <Tab key="NONE" title="无认证">
                <NoAuthorizationLoginForm />
              </Tab>
            </Tabs>
            <div className="flex flex-row-reverse">
              <Button
                variant="light"
                isLoading={loading}
                color="primary"
                onPress={() => onConnectConfFinish()}
              >
                下一步
              </Button>
            </div>
          </div>
        </SteppedPanelItem>
        <SteppedPanelItem>
          <ConfigurationForm2
            toPreviousPage={() => setPage(0)}
            pluginId={props.pluginId}
            formControl={formControl}
            runtimeNodeId={oldState?.id}
          />
        </SteppedPanelItem>
      </SteppedPanel>
    </div>
  )
}

export default SshConfForm
