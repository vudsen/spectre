import React, { useEffect, useRef } from 'react'
import { Alert } from '@heroui/react'
import { useParams } from 'react-router'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import ExtensionPageManager from '@/ext/manager.ts'
import useCrumb from '@/hook/useCrumb.ts'
import { showDialog } from '@/common/util.ts'
import { updateTourStep } from '@/api/impl/sys-conf.ts'
import i18n from '@/i18n'

const RuntimeNodeCreatePluginQuery = graphql(`
  query RuntimeNodeCreatePluginQuery(
    $pluginId: String!
    $runtimeNodeId: String!
  ) {
    runtimeNode {
      plugin(pluginId: $pluginId) {
        id
        page {
          pageName
        }
      }
      runtimeNode(id: $runtimeNodeId) {
        id
        configuration
        name
      }
    }
  }
`)

const UPDATE_CRUMB = [
  { name: i18n.t('hardcoded.msg_pages_runtime_node_modify_param_index_001') },
]
const CREATE_CRUMB = [{ name: i18n.t('hardcoded.msg_pages_home_guide_004') }]
const TEST_RUNTIME_NODE_ID = 'TestRuntimeNodeExtension'

const PluginConfPage: React.FC = () => {
  const params = useParams()
  const searchParams = new URLSearchParams(location.search)
  const runtimeNodeId = searchParams.get('runtimeNodeId') ?? '-1'
  useCrumb(runtimeNodeId ? UPDATE_CRUMB : CREATE_CRUMB)
  const pluginId = params.pluginId!
  const qlParams = useRef({ pluginId, runtimeNodeId })
  const { result, isLoading } = useGraphQL(
    RuntimeNodeCreatePluginQuery,
    qlParams.current,
  )
  useEffect(() => {
    const sp = new URL(location.href).searchParams
    if (sp.get('guide') !== 'true') {
      return
    }
    showDialog({
      title: i18n.t('hardcoded.msg_pages_runtime_node_modify_param_index_002'),
      message: i18n.t(
        'hardcoded.msg_pages_runtime_node_modify_param_index_003',
      ),
      hideCancel: true,
      color: 'primary',
      isDismissable: false,
    })
  }, [])

  if (isLoading) {
    return (
      <div>
        <div>
          {i18n.t('hardcoded.msg_pages_runtime_node_modify_param_index_004')}
        </div>
      </div>
    )
  }
  if (!result || !result.runtimeNode.plugin) {
    return (
      <Alert color="danger">
        {i18n.t('hardcoded.msg_pages_runtime_node_modify_param_index_005')}
      </Alert>
    )
  }
  const plugin = result.runtimeNode.plugin
  const FormComponent = ExtensionPageManager.getFormPage(plugin.page.pageName)

  const onSubmit = () => {
    const sp = new URL(location.href).searchParams
    if (sp.get('guide') !== 'true' || pluginId !== TEST_RUNTIME_NODE_ID) {
      return
    }
    updateTourStep(1).then()
  }

  return (
    <FormComponent
      onSubmit={onSubmit}
      pluginId={pluginId}
      oldState={result.runtimeNode.runtimeNode}
    />
  )
}

export default PluginConfPage
