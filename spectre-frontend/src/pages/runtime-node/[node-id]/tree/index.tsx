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
    title: '节点树',
    text: '节点树会为你列出所有可用的 JVM',
    attachTo: {
      element: '#node-tree',
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
    id: 'expand-tree',
    title: '展开节点树',
    text: '双击即可展开节点树',
    attachTo: {
      element: '#root-tree-0',
      on: 'bottom',
    },
    canClickTarget: true,
  })
  tour.addStep({
    id: 'jvm-flag',
    title: 'JVM 节点',
    text: '当节点的图标为"咖啡"时，代表该节点是一个 JVM 节点',
    attachTo: {
      element: '#jvm-flag',
      on: 'top',
    },
    floatingUIOptions: {
      middleware: [shepherdOffset(0, -60)],
    },
    buttons: [
      {
        text: '下一步',
        action: tour.next,
      },
    ],
  })
  tour.addStep({
    id: 'attach',
    title: '连接节点',
    canClickTarget: true,
    text: '点击该图标，即可连接到 JVM',
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
        <div className="header-1">连接到节点</div>
        {import.meta.env.VITE_IS_PREVIEW_ENV === 'true' && isAlertVisible ? (
          <Alert
            isVisible={isAlertVisible}
            onClose={() => setAlertVisible(false)}
            color="warning"
            title="权限限制"
            variant="faded"
            description="public 用户目前只可以连接 math-game 节点"
          />
        ) : null}

        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">节点信息</div>
            {isLoading || !runtimeNode ? (
              <TableLoadingMask />
            ) : (
              <DetailGrid
                details={[
                  {
                    name: '名称',
                    value: runtimeNode.name,
                  },
                  {
                    name: '标签',
                    value: <LabelsDisplay attributes={runtimeNode.labels} />,
                  },
                  {
                    name: '创建时间',
                    value: formatTime(runtimeNode.createdAt),
                  },
                ]}
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody id="node-tree">
            <div className="mb-3 text-xl font-semibold">节点树</div>
            <div className="text-sm">
              该卡片中将为您展示一颗树，树形结构可以双击展开/合并。在展开的过程中，可能会出现带有{' '}
              <SvgIcon icon={Icon.COFFEE} className="text-primary inline" />{' '}
              的节点，您可以将鼠标放置到节点上，点击右侧{' '}
              <SvgIcon icon={Icon.PLUG} className="text-primary inline" />{' '}
              即可尝试 attach 到目标 JVM。
            </div>
            <div>
              <div className="sticky top-0 box-border bg-white py-3">
                <Input
                  size="sm"
                  labelPlacement="outside"
                  label="搜索"
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
