import React, { useRef } from 'react'
import { Alert } from '@heroui/react'
import { useParams } from 'react-router'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import ExtensionPageManager from '@/ext/manager.ts'
import useCrumb from '@/hook/useCrumb.ts'

const RuntimeNodeCreatePluginQuery = graphql(`
  query RuntimeNodeCreatePluginQuery(
    $pluginId: String
    $runtimeNodeId: String
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

const UPDATE_CRUMB = [{ name: '更新运行节点' }]
const CREATE_CRUMB = [{ name: '创建运行节点' }]

const PluginConfPage: React.FC = () => {
  const params = useParams()
  const searchParams = new URLSearchParams(location.search)
  const runtimeNodeId = searchParams.get('runtimeNodeId')
  useCrumb(runtimeNodeId ? UPDATE_CRUMB : CREATE_CRUMB)
  const pluginId = params.pluginId!
  const qlParams = useRef({ pluginId, runtimeNodeId })
  const { result, isLoading } = useGraphQL(
    RuntimeNodeCreatePluginQuery,
    qlParams.current,
  )

  if (isLoading) {
    return (
      <div>
        <div>加载中...</div>
      </div>
    )
  }
  if (!result || !result.runtimeNode.plugin) {
    return <Alert color="danger">插件不存在!</Alert>
  }
  const plugin = result.runtimeNode.plugin
  const FormComponent = ExtensionPageManager.getFormPage(plugin.page.pageName)

  const onSumbit = (data: unknown) => {
    console.log(data)
  }

  return (
    <FormComponent
      onSubmit={onSumbit}
      pluginId={pluginId}
      oldState={result.runtimeNode.runtimeNode}
    />
  )
}

export default PluginConfPage
