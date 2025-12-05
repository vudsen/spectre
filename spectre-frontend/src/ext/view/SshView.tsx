import type { ViewComponent } from '@/ext/type.ts'
import type { RuntimeNodeDTO } from '@/api/impl/runtime-node.ts'
import React, { useMemo } from 'react'
import DetailGrid, { type Detail } from '@/components/DetailGrid.tsx'
import { formatTime } from '@/common/util.ts'
import { Card, CardBody, Checkbox, Input } from '@heroui/react'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import ReadonlyLabelsTable from '@/components/ReadonlyLabelsTable.tsx'

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
        <div className="header-2">标签</div>
        <ReadonlyLabelsTable labels={labels} />
      </CardBody>
    </Card>
  )
}

const AdvanceInfo: React.FC<{ conf: SshRuntimeNodeConfig }> = ({ conf }) => {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">高级设置</div>
        <div className="header-2">本地</div>
        <Checkbox
          defaultSelected={conf.local.enabled}
          isDisabled
          className="my-0"
        >
          启用
        </Checkbox>
        {conf.local.enabled ? (
          <Input
            label="Java Home"
            defaultValue={conf.local.javaHome}
            placeholder="Java Home, 不填时默认使用 Path 下的 Java 工具"
          />
        ) : null}
        <div className="header-2">Docker</div>
        <Checkbox
          defaultSelected={conf.docker.enabled}
          isDisabled
          className="my-0"
        >
          启用
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
              placeholder="Java Home, 不填时默认使用 Path 下的 Java 工具"
            />
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

const SshView: ViewComponent = (props) => {
  const data = props.data as MyData
  const configuration = useMemo(
    () => JSON.parse(data.configuration) as SshRuntimeNodeConfig,
    [data.configuration],
  )

  const connectInfo: Detail[] = useMemo(() => {
    const p = configuration.principal
    if (!p) {
      return [
        {
          name: '登录方式',
          value: '无',
        },
      ]
    }
    const base: Detail[] = [
      {
        name: 'Address',
        value: configuration.host + ':' + configuration.port,
      },
      {
        name: '用户名',
        value: configuration.username,
      },
    ]
    if (p.loginType === 'KEY') {
      base.push({
        name: '登录方式',
        value: '密钥登录',
      })
    } else if (p.loginType === 'PASSWORD') {
      base.push({
        name: '登录方式',
        value: '用户名密码登录',
      })
    } else {
      base.push({
        name: '登录方式',
        value: '无',
      })
    }
    return base
  }, [configuration])

  const tabs: TabContent[] = useMemo(() => {
    return [
      {
        key: 'connect',
        name: '连接信息',
        content: (
          <Card>
            <CardBody>
              <div className="header-2 mb-3">连接信息</div>
              <DetailGrid details={connectInfo} />
            </CardBody>
          </Card>
        ),
      },
      {
        key: 'advance',
        name: '高级设置',
        content: <AdvanceInfo conf={configuration} />,
      },
      {
        key: 'labels',
        name: '标签',
        content: <LabelsInfo labels={data.labels} />,
      },
    ]
  }, [configuration, connectInfo, data])

  return (
    <div className="space-y-6 px-6 pb-24">
      <div className="spectre-heading">{data.name}</div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">基础信息</div>
          <div className="text-sm">该节点为 SSH 节点。</div>
          <DetailGrid
            details={[
              {
                name: '名称',
                value: data.name,
              },
              {
                name: '类型',
                value: 'SSH',
              },
              {
                name: '创建时间',
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
