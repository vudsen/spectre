import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  SelectItem,
} from '@heroui/react'
import useGraphQL from '@/hook/useGraphQL.ts'
import { graphql } from '@/graphql/generated'
import React, { useRef, useState } from 'react'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import { useNavigate } from 'react-router'
import ExtensionPageManager from '@/ext/manager.ts'

const RuntimeNodePluginQuery = graphql(`
  query RuntimeNodePluginQuery {
    runtimeNode {
      plugins {
        id
        name
        page {
          pageName
        }
      }
    }
  }
`)

const RuntimeNodePluginDetailQuery = graphql(`
  query RuntimeNodePluginDetailQuery($pluginId: String) {
    runtimeNode {
      plugin(pluginId: $pluginId) {
        description
      }
    }
  }
`)

const JvmSourceModifyPage: React.FC = () => {
  const { result, isLoading, errors } = useGraphQL(RuntimeNodePluginQuery)
  const plugins = result?.runtimeNode.plugins ?? []
  const selectedPlugin = useRef<(typeof plugins)[number]>(undefined)
  const [pluginErrorMsg, setPluginErrorMsg] = useState<string>()
  const [pluginInfo, setPluginInfo] =
    useState<DocumentResult<typeof RuntimeNodePluginDetailQuery>>()
  const info = pluginInfo?.runtimeNode.plugin
  const nav = useNavigate()

  const errorMsg = pluginErrorMsg ?? errors.join(';')

  function reset() {
    setPluginErrorMsg(undefined)
    selectedPlugin.current = undefined
    setPluginInfo(undefined)
  }

  const onSelect = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    if (!evt.target.value) {
      reset()
      return
    }
    const plugin = plugins.find((plugin) => plugin.id == evt.target.value)
    if (!plugin) {
      setPluginErrorMsg('无法找到对应插件, id = ' + evt.target.value)
      return
    }
    const pg = ExtensionPageManager.getFormPage(plugin.page.pageName)
    if (!pg) {
      setPluginErrorMsg(
        '前端扩展页面不存在, pageName = ' + plugin.page.pageName,
      )
      return
    }
    selectedPlugin.current = plugin
    // TODO error handle
    execute(RuntimeNodePluginDetailQuery, { pluginId: plugin.id })
      .then((r) => {
        setPluginInfo(r)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  return (
    <div>
      <div className="p-6">
        <Card>
          <CardHeader>
            <span className="text-lg font-bold">创建数据源</span>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-3 text-sm">
            <span>
              创建一个新的数据源。数据源全称为 "JVM 数据源"，作为 spectre
              的入口，我们会从数据源为你列出所有的 JVM 来进行进一步的操作。
            </span>
            <span>选择一个类型来开始:</span>
            <Select
              className="max-w-xs"
              placeholder="选择一个类型"
              onChange={onSelect}
              aria-label="类型"
              isLoading={isLoading}
            >
              {plugins.map((plugin) => (
                <SelectItem aria-label={plugin.name} key={plugin.id}>
                  {plugin.name}
                </SelectItem>
              ))}
            </Select>
            {errorMsg ? (
              <span className="text-danger text-sm">错误: {errorMsg}</span>
            ) : null}
            {info ? (
              <div className="space-y-3">
                <Divider />
                <div className="text-base font-bold">详细信息</div>
                <div>{info.description}</div>
                <div className="border-divider flex w-full flex-row-reverse border-t p-2">
                  <Button
                    color="primary"
                    isDisabled={!pluginInfo}
                    onPress={() => nav(selectedPlugin.current!.id)}
                  >
                    下一步
                  </Button>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default JvmSourceModifyPage
