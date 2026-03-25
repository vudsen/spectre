import React, {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useParams } from 'react-router'
import { expandTree, type JvmTreeNodeDTO } from '@/api/impl/runtime-node.ts'
import RuntimeNodeTree from '@/pages/runtime-node/[node-id]/tree/RuntimeNodeTree.tsx'
import TreeContext, {
  type NodeTreeContext,
} from '@/pages/runtime-node/[node-id]/tree/context.ts'
import ToolchainSelectModal from '@/pages/runtime-node/[node-id]/tree/ToolchainSelectModal.tsx'
import {
  Alert,
  Card,
  CardBody,
  Input,
  Skeleton,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import DetailGrid from '@/components/DetailGrid.tsx'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LabelsDisplay from '@/components/LabelsDisplay'
import {
  appendShepherdStepsBeforeShow,
  formatTime,
  shepherdOffset,
} from '@/common/util.ts'
import Shepherd from 'shepherd.js'
import { updateTourStep } from '@/api/impl/sys-conf.ts'
import 'shepherd.js/dist/css/shepherd.css'
import i18n from '@/i18n'

const NodeInfoQuery = graphql(`
  query NodeInfoQuery($id: String!) {
    runtimeNode {
      runtimeNode(id: $id) {
        name
        labels
        createdAt
      }
    }
  }
`)

function setupTour() {
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

  tour.addStep({
    title: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_001'),
    text: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_002'),
    attachTo: {
      element: '#node-tree',
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
    id: 'expand-tree',
    title: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_003'),
    text: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_004'),
    attachTo: {
      element: '#root-tree-0',
      on: 'bottom',
    },
    canClickTarget: true,
  })
  tour.addStep({
    id: 'jvm-flag',
    title: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_005'),
    text: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_006'),
    attachTo: {
      element: '#jvm-flag',
      on: 'top',
    },
    floatingUIOptions: {
      middleware: [shepherdOffset(0, -60)],
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
    title: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_007'),
    canClickTarget: true,
    text: i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_008'),
    attachTo: {
      element: '#plug-flag',
      on: 'top',
    },
    floatingUIOptions: {
      middleware: [shepherdOffset(0, -60)],
    },
  })
  return tour
}

const RuntimeNodeTreePage: React.FC = () => {
  const params = useParams()
  const nodeId = params['node-id'] ?? '-1'
  const [rootNodes, setRootnNodes] = useState<JvmTreeNodeDTO[]>([])
  const [context, setContext] = useState<NodeTreeContext>()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const selectedSearchNode = useRef<JvmTreeNodeDTO>(undefined)
  const [isRootNodeLoading, setRootNodeLoading] = useState(true)
  const [isAlertVisible, setAlertVisible] = React.useState(true)
  const { isLoading, result } = useGraphQL(
    NodeInfoQuery,
    useMemo(() => {
      return {
        id: nodeId,
      }
    }, [nodeId]),
  )

  const tour = useMemo(() => setupTour(), [])

  useEffect(() => {
    let listeners: Array<() => void> = []
    const contentListeners: Array<(content: string) => void> = []
    setContext({
      nodeId,
      subScribeSelectionChangeOnce: (cb) => {
        listeners.push(cb)
        return cb.length - 1
      },
      onSelectionChange() {
        for (const listener of listeners) {
          listener()
        }
        listeners = []
      },
      requireAttach: (searchNode) => {
        selectedSearchNode.current = searchNode
        if (tour && tour.currentStep?.id === 'attach') {
          tour.complete()
          updateTourStep(2).then()
        }
        onOpen()
      },
      subscribeSearchContentChange: (cb) => {
        contentListeners.push(cb)
        return contentListeners.length
      },
      onSearchContentChange: (content: string) => {
        for (const contentListener of contentListeners) {
          contentListener(content)
        }
      },
      unsubscribeSearchContentChange: (id: number) => {
        contentListeners.splice(id, 1)
      },
      tour,
    })
    expandTree(nodeId)
      .then((nodes) => {
        setRootnNodes(nodes)
      })
      .finally(() => {
        setRootNodeLoading(false)
      })
  }, [nodeId, onOpen, tour])

  useEffect(() => {
    if (tour && rootNodes.length > 0) {
      setTimeout(() => {
        tour.start()
      }, 200)
      return () => {
        tour?.complete()
      }
    }
  }, [rootNodes.length, tour])

  const onSelect = (bundleId: string) => {
    const url = new URL(window.location.href)
    url.pathname = `${import.meta.env.VITE_BASE_PATH}/channel`
    url.search = new URLSearchParams({
      runtimeNodeId: nodeId,
      treeNodeId: selectedSearchNode.current!.id,
      bundleId,
    }).toString()

    window.open(url, '_blank')
  }

  const onInput = (e: FormEvent<HTMLInputElement>) => {
    context?.onSearchContentChange((e.target as HTMLInputElement).value)
  }

  const onRootTreeExpand = () => {
    const tour = context?.tour
    if (!tour || tour.currentStep?.id !== 'expand-tree') {
      return
    }
    setTimeout(() => {
      tour.next()
    }, 200)
  }

  const runtimeNode = result?.runtimeNode.runtimeNode
  if (!context) {
    return null
  }
  return (
    <TreeContext value={context}>
      <div className="mx-6 space-y-5">
        <div className="header-1">
          {i18n.t('hardcoded.msg_pages_runtime_node_list_index_004')}
        </div>
        {import.meta.env.VITE_IS_PREVIEW_ENV === 'true' && isAlertVisible ? (
          <Alert
            isVisible={isAlertVisible}
            onClose={() => setAlertVisible(false)}
            color="warning"
            title={i18n.t(
              'hardcoded.msg_pages_runtime_node_param_tree_index_009',
            )}
            variant="faded"
            description={i18n.t(
              'hardcoded.msg_pages_runtime_node_param_tree_index_010',
            )}
          />
        ) : null}

        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">
              {i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_011')}
            </div>
            {isLoading || !runtimeNode ? (
              <TableLoadingMask />
            ) : (
              <DetailGrid
                details={[
                  {
                    name: i18n.t(
                      'hardcoded.msg_components_labeleditor_index_004',
                    ),
                    value: runtimeNode.name,
                  },
                  {
                    name: i18n.t(
                      'hardcoded.msg_components_labeleditor_index_001',
                    ),
                    value: <LabelsDisplay attributes={runtimeNode.labels} />,
                  },
                  {
                    name: i18n.t(
                      'hardcoded.msg_components_page_permissionslist_index_010',
                    ),
                    value: formatTime(runtimeNode.createdAt),
                  },
                ]}
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody id="node-tree">
            <div className="mb-3 text-xl font-semibold">
              {i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_001')}
            </div>
            <div className="text-sm">
              {i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_012')}{' '}
              <SvgIcon icon={Icon.COFFEE} className="text-primary inline" />{' '}
              {i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_013')}{' '}
              <SvgIcon icon={Icon.PLUG} className="text-primary inline" />{' '}
              {i18n.t('hardcoded.msg_pages_runtime_node_param_tree_index_014')}
            </div>
            <div>
              <div className="sticky top-0 box-border bg-white py-3">
                <Input
                  size="sm"
                  labelPlacement="outside"
                  label={i18n.t(
                    'hardcoded.msg_components_page_permissionslist_index_006',
                  )}
                  onInput={onInput}
                  startContent={<SvgIcon icon={Icon.SEARCH} />}
                />
              </div>
              <div>
                {isRootNodeLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="w-full rounded-lg">
                      <div className="bg-default-200 h-12 w-full rounded-lg" />
                    </Skeleton>
                    <Skeleton className="w-full rounded-lg">
                      <div className="bg-default-200 h-12 w-full rounded-lg" />
                    </Skeleton>
                    <Skeleton className="w-full rounded-lg">
                      <div className="bg-default-200 h-12 w-full rounded-lg" />
                    </Skeleton>
                    <Skeleton className="w-full rounded-lg">
                      <div className="bg-default-200 h-12 w-full rounded-lg" />
                    </Skeleton>
                    <Skeleton className="w-full rounded-lg">
                      <div className="bg-default-200 h-12 w-full rounded-lg" />
                    </Skeleton>
                  </div>
                ) : (
                  <div>
                    {rootNodes.map((node, index) => (
                      <RuntimeNodeTree
                        id={`root-tree-${index}`}
                        key={node.id}
                        onExpanded={onRootTreeExpand}
                        searchNode={node}
                        level={0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ToolchainSelectModal
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              onSelect={onSelect}
              currentNode={selectedSearchNode.current}
            />
          </CardBody>
        </Card>
      </div>
    </TreeContext>
  )
}

export default RuntimeNodeTreePage
