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
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
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
import { AnimatePresence, motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateSearchContent } from '@/store/runtimeNodeTreeSlice'
import BatchConnectDrawerContent from '@/pages/runtime-node/[node-id]/tree/BatchConnectDrawerContent.tsx'

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

const sheetVariants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: '100%',
    opacity: 0,
  },
}

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
  const dispatch = useDispatch()
  const [rootNodes, setRootnNodes] = useState<JvmTreeNodeDTO[]>([])
  const [context, setContext] = useState<NodeTreeContext>()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const batchDialog = useDisclosure()
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
  const batchSelectedNodes = useSelector<RootState, JvmTreeNodeDTO[]>(
    (state) => state.runtimeNodeTree.batchSelectedNodes,
  )

  const tour = useMemo(() => setupTour(), [])

  useEffect(() => {
    setContext({
      nodeId,
      requireAttach: (searchNode) => {
        selectedSearchNode.current = searchNode
        if (tour && tour.currentStep?.id === 'attach') {
          tour.complete()
          updateTourStep(2).then()
        }
        onOpen()
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
    dispatch(updateSearchContent((e.target as HTMLInputElement).value))
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
      <div className="mx-6 space-y-5 pb-20">
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
      <AnimatePresence>
        {batchSelectedNodes.length > 0 ? (
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            className="bg-primary-50 sticky bottom-0 left-0 z-1 flex w-full items-center justify-between px-5 py-3"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            <div>
              <span className="text-primary">
                {i18n.t('runtimeNode.batchConnect')}
              </span>
              <span className="text-default-500 ml-3 text-sm">
                {i18n.t('runtimeNode.batchConnectDesc')}
              </span>
            </div>
            <div>
              <Button
                color="primary"
                variant="flat"
                onPress={batchDialog.onOpen}
              >
                {i18n.t('runtimeNode.batchConnect')}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Drawer
        isOpen={batchDialog.isOpen}
        onOpenChange={batchDialog.onOpenChange}
        size="3xl"
      >
        <DrawerContent>
          {(onClose) => <BatchConnectDrawerContent onClose={onClose} />}
        </DrawerContent>
      </Drawer>
    </TreeContext>
  )
}

export default RuntimeNodeTreePage
