import React, { useEffect, useMemo, useRef } from 'react'
import {
  addToast,
  Button,
  Code,
  Link,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import {
  appendShepherdStepsBeforeShow,
  shepherdOffset,
  showDialog,
} from '@/common/util.ts'
import type { DocumentResult } from '@/graphql/execute.ts'
import { deleteRuntimeNode } from '@/api/impl/runtime-node.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LabelsDisplay from '@/components/LabelsDisplay'
import Time from '@/components/Time.tsx'
import 'shepherd.js/dist/css/shepherd.css'
import Shepherd, { type Tour } from 'shepherd.js'
import i18n from '@/i18n'

const ListJvmSource = graphql(`
  query ListJvmSource($page: Int!, $size: Int!) {
    runtimeNode {
      runtimeNodes(page: $page, size: $size) {
        totalPages
        result {
          id
          name
          createdAt
          pluginId
          labels
          restrictedMode
        }
      }
      plugins {
        id
        name
      }
    }
  }
`)

const pg = { page: 0, size: 10 }
type NodeType = DocumentResult<
  typeof ListJvmSource
>['runtimeNode']['runtimeNodes']['result'][number] & {
  typeName: string
}
const TEST_RUNTIME_NODE_ID = 'TestRuntimeNodeExtension'

type MyHolder = {
  testNodeIndex: number
  nodes: NodeType[]
}

const JvmSourcePage: React.FC = () => {
  const [page, setPage] = useState(pg)
  const { result, isLoading } = useGraphQL(ListJvmSource, page)
  const nav = useNavigate()
  const tourRef = useRef<Tour | null>(null)

  const { nodes, testNodeIndex }: MyHolder = useMemo(() => {
    if (!result) {
      return {
        testNodeIndex: 99999,
        nodes: [],
      }
    }
    const r: NodeType[] = []
    const map = new Map<string, string>()
    for (const plugin of result.runtimeNode.plugins) {
      map.set(plugin.id, plugin.name)
    }
    for (const resultElement of result.runtimeNode.runtimeNodes.result) {
      r.push({
        ...resultElement,
        typeName:
          map.get(resultElement.pluginId) ??
          `UNKNOWN(${resultElement.pluginId})`,
      })
    }
    const testNodeIndex = r.findIndex(
      (node) => node.pluginId === TEST_RUNTIME_NODE_ID,
    )
    return {
      testNodeIndex,
      nodes: r,
    }
  }, [result])

  useEffect(() => {
    if (testNodeIndex >= nodes.length) {
      return
    }
    const sp = new URL(location.href).searchParams
    if (sp.get('guide') !== 'true') {
      return
    }
    if (testNodeIndex < 0) {
      showDialog({
        title: i18n.t('hardcoded.msg_pages_runtime_node_list_index_001'),
        message: i18n.t('hardcoded.msg_pages_runtime_node_list_index_002'),
        color: 'danger',
      })
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
      id: 'show-row',
      title: i18n.t('hardcoded.msg_ext_form_testnodeform_002'),
      text: i18n.t('hardcoded.msg_pages_runtime_node_list_index_003'),
      attachTo: {
        element: '#test-node-row',
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
      id: 'attach',
      title: i18n.t('hardcoded.msg_pages_runtime_node_list_index_004'),
      text: i18n.t('hardcoded.msg_pages_runtime_node_list_index_005'),
      floatingUIOptions: {
        middleware: [shepherdOffset(-30, -30)],
      },
      attachTo: {
        element: '#test-node-attach',
        on: 'left',
      },
      canClickTarget: true,
    })
    showDialog({
      title: i18n.t('hardcoded.msg_pages_runtime_node_list_index_006'),
      message: i18n.t('hardcoded.msg_pages_runtime_node_list_index_007'),
      confirmBtnText: i18n.t('hardcoded.msg_pages_runtime_node_list_index_008'),
      color: 'primary',
      hideCancel: true,
      isDismissable: false,
      onConfirm() {
        tour.start()
      },
    })
  }, [nodes.length, testNodeIndex])

  const totalPage = result?.runtimeNode.runtimeNodes.totalPages ?? 0

  const onCreate = () => {
    nav('/runtime-node/modify')
  }

  const toNodeTree = (id: string) => {
    if (tourRef.current) {
      tourRef.current.complete()
      nav(`/runtime-node/${id}/tree?guide=true`)
    } else {
      nav(`/runtime-node/${id}/tree`)
    }
  }

  const viewNode = (id: string) => {
    nav(`/runtime-node/${id}/view`)
  }

  const deleteNode = (node: NodeType) => {
    showDialog({
      title: i18n.t('hardcoded.msg_pages_runtime_node_list_index_009'),
      message: i18n.t(
        'hardcoded.msg_pages_toolchain_items_toolchainitems_003',
        {
          name: node.name,
        },
      ),
      onConfirm: async () => {
        await deleteRuntimeNode(node.id)
        addToast({
          title: i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_003',
          ),
          color: 'success',
        })
        setPage({ ...page })
      },
      color: 'danger',
    })
  }

  const editNode = (node: NodeType) => {
    nav(`/runtime-node/modify/${node.pluginId}?runtimeNodeId=${node.id}`)
  }

  return (
    <div className="mx-6">
      <div className="mb-3 flex flex-row items-center justify-between">
        <div className="mb-3 text-xl font-semibold">
          {i18n.t('hardcoded.msg_pages_runtime_node_list_index_011')}
        </div>
        <Button variant="flat" color="primary" onPress={onCreate}>
          {i18n.t('hardcoded.msg_pages_runtime_node_list_index_012')}
        </Button>
      </div>
      <Table
        removeWrapper
        aria-label="Jvm datasource table"
        bottomContent={
          totalPage > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page.page + 1}
                total={result?.runtimeNode.runtimeNodes.totalPages ?? 0}
                onChange={(p) => setPage({ page: p, size: page.size - 1 })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_ext_view_k8sview_003')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_labeleditor_index_001')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_page_permissionslist_index_010')}
          </TableColumn>
          <TableColumn align="end">{i18n.t('common.action')}</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={i18n.t(
            'hardcoded.msg_pages_runtime_node_list_index_013',
          )}
          isLoading={isLoading}
          items={nodes}
          loadingContent={<TableLoadingMask />}
        >
          {(item) => (
            <TableRow
              key={item.id}
              id={item === nodes[testNodeIndex] ? 'test-node-row' : undefined}
            >
              <TableCell className="flex items-center">
                {item.restrictedMode ? (
                  <Tooltip
                    content={i18n.t(
                      'hardcoded.msg_pages_runtime_node_list_index_014',
                    )}
                    className="outline-0"
                  >
                    <SvgIcon
                      icon={Icon.SHIELD}
                      size={22}
                      className="text-primary-500 ml-0.5"
                    />
                  </Tooltip>
                ) : null}
                <Link
                  onPress={() => viewNode(item.id)}
                  color="primary"
                  underline="always"
                  className="cursor-pointer"
                  size="sm"
                >
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>
                <Code>{item.typeName}</Code>
              </TableCell>
              <TableCell>
                <LabelsDisplay attributes={item.labels} />
              </TableCell>
              <TableCell>
                <Time time={item.createdAt} />
              </TableCell>
              <TableCell>
                <div className="relative flex items-center justify-end gap-2">
                  <Tooltip
                    content={i18n.t(
                      'hardcoded.msg_pages_runtime_node_list_index_015',
                    )}
                  >
                    <Button
                      id={
                        item === nodes[testNodeIndex]
                          ? 'test-node-attach'
                          : undefined
                      }
                      size="sm"
                      isIconOnly
                      color="primary"
                      variant="light"
                      onPress={() => toNodeTree(item.id)}
                    >
                      <SvgIcon icon={Icon.PLUG} size={20} />
                    </Button>
                  </Tooltip>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => editNode(item)}
                  >
                    <SvgIcon icon={Icon.EDIT} />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={() => deleteNode(item)}
                  >
                    <SvgIcon icon={Icon.TRASH} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default JvmSourcePage
