import {
  Button,
  Card,
  CardBody,
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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      <div className="space-y-5 px-6">
        <div className="spectre-heading">{t('router.newRuntimeNode')}</div>
        <Card>
          <CardBody className="space-y-3 text-sm">
            <span className="header-2">{t('runtimeNode.selectType')}</span>
            <div>{t('runtimeNode.selectTypeInfo1')}</div>
            <div>{t('runtimeNode.selectTypeInfo2')}</div>
            <div>{t('runtimeNode.selectTypeInfo3')}</div>
            <Select
              className="max-w-xs"
              placeholder={t('runtimeNode.selectTypeTip')}
              onChange={onSelect}
              aria-label="Runtime Node Type"
              isLoading={isLoading}
            >
              {plugins.map((plugin) => (
                <SelectItem aria-label={plugin.name} key={plugin.id}>
                  {plugin.name}
                </SelectItem>
              ))}
            </Select>
            {errorMsg ? (
              <span className="text-danger text-sm">Error: {errorMsg}</span>
            ) : null}
            {info ? (
              <div className="space-y-3">
                <Divider />
                <div className="text-base font-bold">{t('common.detail')}</div>
                <div>{info.description}</div>
                <div className="border-divider flex w-full flex-row-reverse border-t p-2">
                  <Button
                    color="primary"
                    isDisabled={!pluginInfo}
                    onPress={() => nav(selectedPlugin.current!.id)}
                  >
                    {t('common.next')}
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
