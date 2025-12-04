import React, { useMemo } from 'react'
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
import { formatTime, showDialog } from '@/common/util.ts'
import type { DocumentResult } from '@/graphql/execute.ts'
import { deleteRuntimeNode } from '@/api/impl/runtime-node.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LabelsDisplay from '@/components/LabelsDisplay'

const ListJvmSource = graphql(`
  query ListJvmSource($page: Int, $size: Int) {
    runtimeNode {
      runtimeNodes(page: $page, size: $size) {
        totalPages
        result {
          id
          name
          createdAt
          pluginId
          labels
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

const JvmSourcePage: React.FC = () => {
  const [page, setPage] = useState(pg)
  const { result, isLoading } = useGraphQL(ListJvmSource, page)
  const nav = useNavigate()

  const nodes: NodeType[] = useMemo(() => {
    if (!result) {
      return []
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
    return r
  }, [result])

  const totalPage = result?.runtimeNode.runtimeNodes.totalPages ?? 0

  const onCreate = () => {
    nav('/runtime-node/new')
  }

  const toNodeTree = (id: string) => {
    nav(`/runtime-node/${id}/tree`)
  }

  const deleteNode = (node: NodeType) => {
    showDialog({
      title: '删除节点',
      message: `确定删除节点 ${node.name} 吗?`,
      onConfirm: async () => {
        await deleteRuntimeNode(node.id)
        addToast({
          title: '删除成功',
          color: 'success',
        })
        setPage({ ...page })
      },
      color: 'danger',
    })
  }

  const editNode = (node: NodeType) => {
    nav(`/runtime-node/new/${node.pluginId}?runtimeNodeId=${node.id}`)
  }

  return (
    <div className="mx-6">
      <div className="mb-3 flex flex-row items-center justify-between">
        <div className="mb-3 text-xl font-semibold">节点列表</div>
        <Button variant="flat" color="primary" onPress={onCreate}>
          + 新建
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
                page={page.page}
                total={result?.runtimeNode.runtimeNodes.totalPages ?? 0}
                onChange={(p) => setPage({ page: p, size: page.size })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>类型</TableColumn>
          <TableColumn>标签</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="没有任何数据源"
          isLoading={isLoading}
          items={nodes}
          loadingContent={<TableLoadingMask />}
        >
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link
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
              <TableCell>{formatTime(item.createdAt)}</TableCell>
              <TableCell>
                <div className="relative flex items-center justify-end gap-2">
                  <Tooltip content="连接该节点">
                    <Button
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
