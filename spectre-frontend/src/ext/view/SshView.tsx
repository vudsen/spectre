import type { ViewComponent } from '@/ext/type.ts'
import type { RuntimeNodeDTO } from '@/api/impl/runtime-node.ts'
import React, { useMemo } from 'react'
import DetailGrid, { type Detail } from '@/components/DetailGrid.tsx'
import { formatTime } from '@/common/util.ts'
import { Card, CardBody, Checkbox, Input } from '@heroui/react'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import ReadonlyLabelsTable from '@/components/ReadonlyLabelsTable.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import i18n from '@/i18n'

type MyData = RuntimeNodeDTO

type LoginPrincipal = {
  loginType: string
  password?: string
  secretKey?: string
  secretKeyPassword?: string
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

const LabelsInfo: React.FC<{ labels: Record<string, string> }> = ({
  labels,
}) => {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">
          {i18n.t('hardcoded.msg_components_labeleditor_index_001')}
        </div>
        <ReadonlyLabelsTable labels={labels} />
      </CardBody>
    </Card>
  )
}

const AdvanceInfo: React.FC<{ conf: SshRuntimeNodeConfig }> = ({ conf }) => {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">
          {i18n.t('hardcoded.msg_ext_view_sshview_001')}
        </div>
        <div className="header-2">
          {i18n.t('hardcoded.msg_ext_form_sshconfform_005')}
        </div>
        <Checkbox
          defaultSelected={conf.local.enabled}
          isDisabled
          className="my-0"
        >
          {i18n.t('hardcoded.msg_ext_form_sshconfform_006')}
        </Checkbox>
        {conf.local.enabled ? (
          <Input
            label="Java Home"
            defaultValue={conf.local.javaHome}
            placeholder={i18n.t('hardcoded.msg_ext_form_sshconfform_008')}
          />
        ) : null}
        <div className="header-2">Docker</div>
        <Checkbox
          defaultSelected={conf.docker.enabled}
          isDisabled
          className="my-0"
        >
          {i18n.t('hardcoded.msg_ext_form_sshconfform_006')}
        </Checkbox>
        {conf.docker.enabled ? (
          <div className="space-y-3">
            <Input
              label="Spectre Home"
              defaultValue={conf.docker.spectreHome}
            />
            <Input
              label="Docker Path"
              defaultValue={conf.docker.executablePath}
            />
            <Input
              label="Java Home"
              defaultValue={conf.docker.javaHome}
              placeholder={i18n.t('hardcoded.msg_ext_form_sshconfform_008')}
            />
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

const SshView: ViewComponent = (props) => {
  const data = props.data as MyData
  const configuration = data.configuration as SshRuntimeNodeConfig

  const connectInfo: Detail[] = useMemo(() => {
    const p = configuration.principal
    if (!p) {
      return [
        {
          name: i18n.t('hardcoded.msg_ext_view_sshview_002'),
          value: i18n.t('hardcoded.msg_components_simplelist_001'),
        },
      ]
    }
    const base: Detail[] = [
      {
        name: 'Address',
        value: configuration.host + ':' + configuration.port,
      },
      {
        name: i18n.t('common.username'),
        value: configuration.username,
      },
    ]
    if (p.loginType === 'KEY') {
      base.push({
        name: i18n.t('hardcoded.msg_ext_view_sshview_002'),
        value: i18n.t('hardcoded.msg_ext_view_sshview_003'),
      })
    } else if (p.loginType === 'PASSWORD') {
      base.push({
        name: i18n.t('hardcoded.msg_ext_view_sshview_002'),
        value: i18n.t('hardcoded.msg_ext_view_sshview_004'),
      })
    } else {
      base.push({
        name: i18n.t('hardcoded.msg_ext_view_sshview_002'),
        value: i18n.t('hardcoded.msg_components_simplelist_001'),
      })
    }
    return base
  }, [configuration])

  const tabs: TabContent[] = useMemo(() => {
    return [
      {
        key: 'connect',
        name: i18n.t('hardcoded.msg_ext_view_k8sview_004'),
        content: (
          <Card>
            <CardBody>
              <div className="header-2 mb-3">
                {i18n.t('hardcoded.msg_ext_view_k8sview_004')}
              </div>
              <DetailGrid details={connectInfo} />
            </CardBody>
          </Card>
        ),
      },
      {
        key: 'advance',
        name: i18n.t('hardcoded.msg_ext_view_sshview_001'),
        content: <AdvanceInfo conf={configuration} />,
      },
      {
        key: 'labels',
        name: i18n.t('hardcoded.msg_components_labeleditor_index_001'),
        content: <LabelsInfo labels={data.labels} />,
      },
    ]
  }, [configuration, connectInfo, data])

  return (
    <div className="space-y-6 px-6 pb-24">
      <div className="spectre-heading flex items-center">
        {data.restrictedMode ? <SvgIcon icon={Icon.SHIELD} size={26} /> : null}
        {data.name}
      </div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">
            {i18n.t('hardcoded.msg_ext_view_k8sview_001')}
          </div>
          <div className="text-sm">
            {i18n.t('hardcoded.msg_ext_view_sshview_005')}
          </div>
          <DetailGrid
            details={[
              {
                name: i18n.t('hardcoded.msg_components_labeleditor_index_004'),
                value: data.name,
              },
              {
                name: i18n.t('hardcoded.msg_ext_view_k8sview_003'),
                value: 'SSH',
              },
              {
                name: i18n.t(
                  'hardcoded.msg_components_runtimenodebasicinputs_002',
                ),
                value: data.restrictedMode
                  ? i18n.t('hardcoded.msg_ext_view_sshview_006')
                  : i18n.t('hardcoded.msg_ext_view_sshview_007'),
              },
              {
                name: i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_010',
                ),
                value: formatTime(data.createdAt),
              },
            ]}
          />
        </CardBody>
      </Card>

      <SpectreTabs tabs={tabs}></SpectreTabs>
    </div>
  )
}

export default SshView
