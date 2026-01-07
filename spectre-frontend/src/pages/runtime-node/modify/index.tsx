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
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import { useNavigate } from 'react-router'
import ExtensionPageManager from '@/ext/manager.ts'
import { useTranslation } from 'react-i18next'
import 'shepherd.js/dist/css/shepherd.css'
import Shepherd, { type Tour } from 'shepherd.js'
import {
  appendShepherdStepsBeforeShow,
  shepherdOffset,
  showDialog,
} from '@/common/util.ts'

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

const TEST_RUNTIME_NODE_ID = 'TestRuntimeNodeExtension'

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
  const tourRef = useRef<Tour | null>(null)

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
    if (tourRef.current) {
      if (TEST_RUNTIME_NODE_ID !== evt.target.value) {
        setPluginErrorMsg('请选中 Test 以继续教程')
        return
      }
    }
    setPluginErrorMsg(undefined)
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
        const tour = tourRef.current
        if (tour && tour.currentStep?.id === 'select-type') {
          setTimeout(() => {
            tour.next()
          }, 200)
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }

  useEffect(() => {
    const sp = new URL(location.href).searchParams
    if (sp.get('guide') !== 'true') {
      return
    }
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        canClickTarget: false,
        modalOverlayOpeningPadding: 12,
        floatingUIOptions: {
          middleware: [shepherdOffset(0, 30)],
        },
      },
    })
    tour.options.defaultStepOptions!.beforeShowPromise =
      appendShepherdStepsBeforeShow(tour)
    tourRef.current = tour

    tour.addStep({
      id: 'select-type',
      title: '展开类型',
      text: 'Spectre 支持多种方式来连接 JVM，点击这里可以查看支持的类型。请选择 `Test` 以继续教程',
      attachTo: {
        element: '#select-type',
        on: 'bottom',
      },
      buttons: [
        {
          text: '了解',
          action: tour.hide,
        },
      ],
    })
    tour.addStep({
      id: 'description',
      title: '类型信息',
      text: '此处将显示具体的类型信息',
      attachTo: {
        element: '#extension-description',
        on: 'bottom',
      },
      buttons: [
        {
          text: '下一步',
          action: tour.next,
        },
      ],
    })
    tour.addStep({
      id: 'confirm',
      title: '进入配置界面',
      text: '点击此处进入配置界面',
      canClickTarget: true,
      attachTo: {
        element: '#runtime-node-next-btn',
        on: 'left',
      },
      floatingUIOptions: {
        middleware: [
          {
            name: 'offset',
            fn: (state) => {
              return {
                x: state.x - 30,
                y: state.y - 30,
              }
            },
          },
        ],
      },
    })

    showDialog({
      title: '教程',
      message:
        '在本教程中，将会创建一个测试节点，该节点仅用于测试功能，不会产生实际连接',
      hideCancel: true,
      isDismissable: false,
      confirmBtnText: '开始',
      color: 'primary',
      onConfirm() {
        tour.start()
      },
    })
  }, [])

  const toNext = useCallback(() => {
    tourRef.current?.complete()
    let sp: string
    if (tourRef.current) {
      sp = '?guide=true'
    } else {
      sp = ''
    }
    nav(`${selectedPlugin.current!.id}${sp}`)
  }, [nav])

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
              id="select-type"
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
                <div id="extension-description">{info.description}</div>
                <div className="border-divider flex w-full flex-row-reverse border-t p-2">
                  <Button
                    color="primary"
                    id="runtime-node-next-btn"
                    isDisabled={!pluginInfo}
                    onPress={toNext}
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
