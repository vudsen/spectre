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
import i18n from '@/i18n'

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
    principal.secretKey = undefined
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
          title: i18n.t('common.updateSuccess'),
          color: 'success',
        })
      } else {
        await createRuntimeNode({
          ...values,
          pluginId: props.pluginId,
          configuration,
        })
        addToast({
          title: i18n.t('common.createSuccess'),
          color: 'success',
        })
      }
      nav('/runtime-node/list')
    } catch (e) {
      handleError(e, i18n.t('hardcoded.msg_ext_form_sshconfform_001'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="space-y-5">
        <div className="header-1">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_002')}
        </div>
        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">
              {i18n.t('hardcoded.msg_ext_form_sshconfform_003')}
            </div>
            <div className="text-sm">
              {i18n.t('hardcoded.msg_ext_form_sshconfform_004')}
            </div>
            <div className="text-xl font-semibold">
              {i18n.t('hardcoded.msg_ext_form_sshconfform_005')}
            </div>
            <div>
              <div className="flex flex-row items-center">
                <ControlledCheckbox
                  control={control}
                  name="configuration.local.enabled"
                  checkboxProps={{
                    classNames: { base: 'mr-0.5' },
                  }}
                >
                  {i18n.t('hardcoded.msg_ext_form_sshconfform_006')}
                </ControlledCheckbox>
                <Tooltip
                  content={i18n.t('hardcoded.msg_ext_form_sshconfform_007')}
                >
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
                      placeholder: i18n.t(
                        'hardcoded.msg_ext_form_sshconfform_008',
                      ),
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
                  {i18n.t('hardcoded.msg_ext_form_sshconfform_006')}
                </ControlledCheckbox>
                <Tooltip
                  content={i18n.t('hardcoded.msg_ext_form_sshconfform_009')}
                >
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
                      placeholder: i18n.t(
                        'hardcoded.msg_ext_form_sshconfform_010',
                      ),
                    }}
                  />
                  <ControlledInput
                    control={control}
                    name="configuration.docker.javaHome"
                    inputProps={{
                      label: 'Java Home',
                      placeholder: i18n.t(
                        'hardcoded.msg_ext_form_sshconfform_008',
                      ),
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
            {props.runtimeNodeId
              ? i18n.t('hardcoded.msg_ext_form_k8sconfform_005')
              : i18n.t('hardcoded.msg_ext_form_sshconfform_011')}
          </Button>
          <Button
            variant="light"
            onPress={props.toPreviousPage}
            isDisabled={loading}
          >
            {i18n.t('hardcoded.msg_ext_form_sshconfform_012')}
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
        <div className="header-2">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_013')}
        </div>
        <div className="text-sm">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_014')}
        </div>
        <ControlledInput
          control={props.control}
          name="configuration.principal.password"
          inputProps={{
            label: i18n.t('hardcoded.msg_ext_form_sshconfform_015'),
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
        <div className="header-2">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_016')}
        </div>
        <div className="text-sm">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_017')}
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
        <div className="header-2">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_018')}
        </div>
        <div className="text-sm">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_019')}
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
        handleError(r, i18n.t('hardcoded.msg_ext_form_sshconfform_020'))
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
                <div className="header-2 font-semibold">
                  {i18n.t('hardcoded.msg_ext_form_k8sconfform_001')}
                </div>
                <div className="text-sm">
                  {i18n.t('hardcoded.msg_ext_form_sshconfform_021')}
                </div>
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
                  inputProps={{
                    isRequired: true,
                    label: i18n.t('common.username'),
                  }}
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
                    label: i18n.t('hardcoded.msg_ext_form_sshconfform_022'),
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
              <Tab
                key="PASSWORD"
                title={i18n.t('hardcoded.msg_ext_form_sshconfform_023')}
              >
                <PasswordLoginForm control={control} />
              </Tab>
              <Tab
                key="KEY"
                title={i18n.t('hardcoded.msg_ext_form_sshconfform_024')}
              >
                <SshKeyLoginForm control={control} />
              </Tab>
              <Tab
                key="NONE"
                title={i18n.t('hardcoded.msg_ext_form_sshconfform_018')}
              >
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
                {i18n.t('common.next')}
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
