import {
  Alert,
  Button,
  Chip,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import i18n from '@/i18n'
import React, {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { graphql } from '@/graphql/generated'
import { store } from '@/store'
import { emptyList, handleError, showDialog } from '@/common/util.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import type { BatchChannelCreateProps } from '@/pages/channel/BatchChannelCreate.tsx'
import { useParams } from 'react-router'

const ToolchainBundleQueryForBatchAttach = graphql(`
  query ToolchainBundleQueryForBatchAttach {
    toolchain {
      toolchainBundles(page: 0, size: 10) {
        result {
          id
          name
        }
      }
    }
  }
`)

const ArthasInstanceListQuery = graphql(`
  query ArthasInstanceListQuery($page: Int!, $size: Int!) {
    arthasInstance {
      list(page: $page, size: $size) {
        totalPages
        result {
          id
          runtimeNodeId
          jvm {
            name
          }
        }
      }
    }
  }
`)

const RuntimeNodeNameBatchQuery = graphql(`
  query RuntimeNodeNameBatchQuery($ids: [String!]!) {
    runtimeNode {
      byIds(ids: $ids) {
        id
        name
      }
    }
  }
`)

type SimpleJvm = {
  id: string
  name: string
  type: 'tree' | 'instance'
  runtimeNodeName: string
  runtimeNodeId: string
}

const INIT_PAGE = {
  page: 0,
  size: 10,
}
interface BatchConnectDrawerContentProps {
  onClose: () => void
}

type ArthasInstance = {
  id: string
  name: string
  type: 'instance'
  runtimeNodeName: string
  runtimeNodeId: string
}

type MyData = {
  instances: ArthasInstance[]
  totalPage: number
}
const INIT_DATA = { instances: [], totalPage: 0 }
const useArthasInstanceList = (hiddenIdsObj: { id: string }[]) => {
  const nameMap = useRef<Record<string, string>>({})
  const [page, setPage] = useState(INIT_PAGE)
  const [allData, setAllData] = useState<MyData>(INIT_DATA)

  useEffect(() => {
    execute(ArthasInstanceListQuery, page).then((instanceResut) => {
      const ids: string[] = []
      for (const resultElement of instanceResut.arthasInstance.list.result) {
        if (nameMap.current[resultElement.runtimeNodeId]) {
          continue
        }
        ids.push(resultElement.runtimeNodeId)
      }
      if (ids.length === 0) {
        setAllData({
          instances: instanceResut.arthasInstance.list.result.map(
            (instance) => ({
              id: instance.id,
              name: instance.jvm.name,
              type: 'instance',
              runtimeNodeName: nameMap.current[instance.runtimeNodeId],
              runtimeNodeId: instance.runtimeNodeId,
            }),
          ),
          totalPage: instanceResut.arthasInstance.list.totalPages,
        })
        return
      }
      execute(RuntimeNodeNameBatchQuery, { ids }).then((r) => {
        for (const byId of r.runtimeNode.byIds) {
          nameMap.current[byId.id] = byId.name
        }
        setAllData({
          instances: instanceResut.arthasInstance.list.result.map(
            (instance) => ({
              id: instance.id,
              name: instance.jvm.name,
              type: 'instance',
              runtimeNodeName: nameMap.current[instance.runtimeNodeId],
              runtimeNodeId: instance.runtimeNodeId,
            }),
          ),
          totalPage: instanceResut.arthasInstance.list.totalPages,
        })
      })
    })
  }, [page])

  const data = useMemo(() => {
    return {
      totalPage: allData.totalPage,
      instances: allData.instances.filter(
        (instance) => !hiddenIdsObj.find((obj) => obj.id === instance.id),
      ),
    }
  }, [allData, hiddenIdsObj])

  return {
    data,
    setPage,
    page,
  }
}

const BatchConnectDrawerContent: React.FC<BatchConnectDrawerContentProps> = ({
  onClose,
}) => {
  const [isBundleLoading, setBundleLoading] = useState(true)
  const [bundles, setBundles] =
    useState<DocumentResult<typeof ToolchainBundleQueryForBatchAttach>>()
  const params = useParams()
  const runtimeNodeId = params['node-id'] ?? '-1'

  const [bundleId, setBundleId] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<SimpleJvm[]>(() =>
    store
      .getState()
      .runtimeNodeTree.batchSelectedNodes.map<SimpleJvm>((node) => ({
        id: node.id,
        name: node.name,
        runtimeNodeName: i18n.t('runtimeNode.current'),
        type: 'tree',
        runtimeNodeId,
      })),
  )
  const { data, setPage, page } = useArthasInstanceList(selectedNode)

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setBundleId([e.target.value])
  }
  useEffect(() => {
    execute(ToolchainBundleQueryForBatchAttach)
      .then((r) => {
        setBundles(r)
        const bundles = r.toolchain.toolchainBundles.result
        if (bundles.length > 0) {
          setBundleId([r.toolchain.toolchainBundles.result[0].id])
        }
      })
      .catch((e) => handleError(e))
      .finally(() => {
        setBundleLoading(false)
      })
  }, [])

  const onAdd = (node: ArthasInstance) => {
    setSelectedNode((prevState) => {
      if (prevState.find((prev) => prev.id === node.id)) {
        return prevState
      }
      return [...prevState, node]
    })
  }

  const onDelete = (node: SimpleJvm) => {
    setSelectedNode((prevState) => {
      const i = prevState.findIndex((prev) => prev.id === node.id)
      if (i < 0) {
        return prevState
      }
      return prevState.toSpliced(i, 1)
    })
  }

  const doBatchConnect = () => {
    if (selectedNode.length < 2) {
      showDialog({
        title: i18n.t('common.error'),
        message: i18n.t('runtimeNode.atLeastTwoNode'),
        color: 'danger',
      })
      return
    }
    const batch: BatchChannelCreateProps['channels'] = selectedNode.map(
      (node) => ({
        bundleId: bundleId[0],
        runtimeNodeId: node.runtimeNodeId,
        treeNodeId: node.id,
        name: node.name,
      }),
    )

    const url = new URL(window.location.href)
    url.pathname = `${import.meta.env.VITE_BASE_PATH}/channel`
    url.search = new URLSearchParams({
      batch: JSON.stringify(batch),
    }).toString()

    window.open(url, '_blank')
  }

  const bundles0 = bundles?.toolchain.toolchainBundles.result ?? emptyList()

  return (
    <>
      <DrawerHeader>{i18n.t('runtimeNode.batchConnect')}</DrawerHeader>
      <DrawerBody className="space-y-3">
        <Select
          label={i18n.t(
            'hardcoded.msg_pages_runtime_node_param_tree_toolchainselectmodal_003',
          )}
          isLoading={isBundleLoading}
          onChange={onChange}
          selectedKeys={bundleId}
          isRequired
          defaultSelectedKeys={['latest']}
        >
          {bundles0.map((bundle) => (
            <SelectItem key={bundle.id}>{bundle.name}</SelectItem>
          ))}
        </Select>
        <div>
          <div className="mb-2">{i18n.t('runtimeNode.batchSelected')}</div>
          <Table aria-label="Selected nodes" removeWrapper>
            <TableHeader>
              <TableColumn>{i18n.t('runtimeNode.name')}</TableColumn>
              <TableColumn>{i18n.t('runtimeNode.jvmName')}</TableColumn>
              <TableColumn>{i18n.t('common.type')}</TableColumn>
              <TableColumn>{i18n.t('common.action')}</TableColumn>
            </TableHeader>
            <TableBody items={selectedNode}>
              {(row) => (
                <TableRow>
                  <TableCell>
                    <span
                      className={
                        row.type === 'tree' ? 'text-default-500 italic' : ''
                      }
                    >
                      {row.runtimeNodeName}
                    </span>
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip
                      color={row.type === 'instance' ? 'primary' : 'secondary'}
                    >
                      {row.type === 'instance'
                        ? i18n.t('runtimeNode.runningInstance')
                        : i18n.t('runtimeNode.pendingConnectInstance')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="danger"
                      variant="light"
                      isIconOnly
                      onPress={() => onDelete(row)}
                      isDisabled={row.type === 'tree'}
                    >
                      <SvgIcon icon={Icon.TRASH} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3">
          <div>{i18n.t('runtimeNode.otherNodes')}</div>
          <Alert
            color="warning"
            title={i18n.t('common.tip')}
            variant="faded"
            description={i18n.t('runtimeNode.otherNodesDesc')}
          />
          <Table
            aria-label="Available nodes"
            removeWrapper
            bottomContent={
              data.totalPage > 1 ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="secondary"
                    page={page.page}
                    total={data.totalPage}
                    onChange={(page) => setPage({ page, size: 10 })}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>{i18n.t('runtimeNode.name')}</TableColumn>
              <TableColumn>{i18n.t('runtimeNode.jvmName')}</TableColumn>
              <TableColumn>{i18n.t('common.action')}</TableColumn>
            </TableHeader>
            <TableBody
              items={data.instances}
              emptyContent={i18n.t('common.empty')}
            >
              {(row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span>{row.runtimeNodeName}</span>
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      variant="light"
                      isIconOnly
                      onPress={() => onAdd(row)}
                    >
                      <span className="text-2xl font-bold">+</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          {i18n.t('common.cancel')}
        </Button>
        <Button color="primary" onPress={doBatchConnect}>
          {i18n.t('router.connect')}
        </Button>
      </DrawerFooter>
    </>
  )
}

export default BatchConnectDrawerContent
