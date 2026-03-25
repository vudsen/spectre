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
import i18n from '@/i18n'
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
  query RuntimeNodePluginDetailQuery($pluginId: String!) {
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
        setPluginErrorMsg(
          i18n.t('hardcoded.msg_pages_runtime_node_modify_index_001'),
        )
        return
      }
    }
    setPluginErrorMsg(undefined)
    const plugin = plugins.find((plugin) => plugin.id == evt.target.value)

    if (!plugin) {
      setPluginErrorMsg(
        i18n.t('hardcoded.msg_pages_runtime_node_modify_index_002') +
          evt.target.value,
      )
      return
    }
    const pg = ExtensionPageManager.getFormPage(plugin.page.pageName)
    if (!pg) {
      setPluginErrorMsg(
        i18n.t('hardcoded.msg_pages_runtime_node_modify_index_003') +
          plugin.page.pageName,
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
      title: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_004'),
      text: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_005'),
      attachTo: {
        element: '#select-type',
        on: 'bottom',
      },
      buttons: [
        {
          text: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_006'),
          action: tour.hide,
        },
      ],
    })
    tour.addStep({
      id: 'description',
      title: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_007'),
      text: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_008'),
      attachTo: {
        element: '#extension-description',
        on: 'bottom',
      },
      buttons: [
        {
          text: i18n.t('common.next'),
          action: tour.next,
        },
      ],
    })
    tour.addStep({
      id: 'confirm',
      title: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_009'),
      text: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_010'),
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
      title: i18n.t(
        'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_004',
      ),
      message: i18n.t('hardcoded.msg_pages_runtime_node_modify_index_011'),
      hideCancel: true,
      isDismissable: false,
      confirmBtnText: i18n.t('hardcoded.msg_pages_runtime_node_list_index_008'),
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
    nav(`./${selectedPlugin.current!.id}${sp}`)
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
