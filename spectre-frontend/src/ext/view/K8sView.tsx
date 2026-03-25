import type { ViewComponent } from '@/ext/type.ts'
import type { RuntimeNodeDTO } from '@/api/impl/runtime-node.ts'
import { Card, CardBody } from '@heroui/react'
import { formatTime } from '@/common/util.ts'
import DetailGrid from '@/components/DetailGrid.tsx'
import ReadonlyLabelsTable from '@/components/ReadonlyLabelsTable.tsx'
import i18n from '@/i18n'

type K8sRuntimeNodeConfig = {
  apiServerEndpoint: string
  spectreHome?: string
  insecure: boolean
}

const K8sView: ViewComponent = (props) => {
  const data = props.data as RuntimeNodeDTO
  const configuration = data.configuration as K8sRuntimeNodeConfig
  return (
    <div className="space-y-6 px-6 pb-24">
      <div className="header-1">{data.name}</div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">
            {i18n.t('hardcoded.msg_ext_view_k8sview_001')}
          </div>
          <div className="text-sm">
            {i18n.t('hardcoded.msg_ext_view_k8sview_002')}
          </div>
          <DetailGrid
            details={[
              {
                name: i18n.t('hardcoded.msg_components_labeleditor_index_004'),
                value: data.name,
              },
              {
                name: i18n.t('hardcoded.msg_ext_view_k8sview_003'),
                value: 'Kubernetes',
              },
              {
                name: i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_010',
                ),
                value: formatTime(data.createdAt),
              },
            ]}
          />
          <div className="header-2">
            {i18n.t('hardcoded.msg_ext_view_k8sview_004')}
          </div>
          <DetailGrid
            details={[
              {
                name: 'Api Server Endpoint',
                value: configuration.apiServerEndpoint,
              },
              {
                name: i18n.t('hardcoded.msg_ext_view_k8sview_005'),
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
          <div className="header-2">
            {i18n.t('hardcoded.msg_components_labeleditor_index_001')}
          </div>
          <ReadonlyLabelsTable labels={data.labels} />
        </CardBody>
      </Card>
    </div>
  )
}

export default K8sView
