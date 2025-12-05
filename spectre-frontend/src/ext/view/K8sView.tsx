import type { ViewComponent } from '@/ext/type.ts'
import { useMemo } from 'react'
import type { RuntimeNodeDTO } from '@/api/impl/runtime-node.ts'
import { Card, CardBody } from '@heroui/react'
import { formatTime } from '@/common/util.ts'
import DetailGrid from '@/components/DetailGrid.tsx'
import ReadonlyLabelsTable from '@/components/ReadonlyLabelsTable.tsx'

type K8sRuntimeNodeConfig = {
  apiServerEndpoint: string
  spectreHome?: string
  insecure: boolean
}

const K8sView: ViewComponent = (props) => {
  const data = props.data as RuntimeNodeDTO
  const configuration = useMemo(
    () => JSON.parse(data.configuration) as K8sRuntimeNodeConfig,
    [data.configuration],
  )
  return (
    <div className="space-y-6 px-6 pb-24">
      <div className="header-1">{data.name}</div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">基础信息</div>
          <div className="text-sm">该节点为 Kubernetes 节点。</div>
          <DetailGrid
            details={[
              {
                name: '名称',
                value: data.name,
              },
              {
                name: '类型',
                value: 'Kubernetes',
              },
              {
                name: '创建时间',
                value: formatTime(data.createdAt),
              },
            ]}
          />
          <div className="header-2">连接信息</div>
          <DetailGrid
            details={[
              {
                name: 'Api Server Endpoint',
                value: configuration.apiServerEndpoint,
              },
              {
                name: '忽略 SSL',
                value: configuration.insecure.toString(),
              },
              {
                name: 'Spectre Home',
                value: configuration.spectreHome,
              },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">标签</div>
          <ReadonlyLabelsTable labels={data.labels} />
        </CardBody>
      </Card>
    </div>
  )
}

export default K8sView
