import { graphql } from '@/graphql/generated'
import {
  Button,
  Card,
  CardBody,
  Link,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import useGraphQL from '@/hook/useGraphQL.ts'
import React, { useCallback, useState } from 'react'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LabelsDisplay from '@/components/LabelsDisplay'
import { useNavigate } from 'react-router'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

const ListRuntimeNodesSimpleQuery = graphql(`
  query ListRuntimeNodesSimpleQuery($page: Int, $size: Int) {
    runtimeNode {
      runtimeNodes(page: $page, size: $size) {
        totalPages
        result {
          id
          name
          labels
        }
      }
    }
  }
`)

const Home: React.FC = () => {
  const nav = useNavigate()
  const [runtimeNodesQlArgs, setRuntimeNodesQlArgs] = useState({
    page: 0,
    size: 5,
  })
  const runtimeNodes = useGraphQL(
    ListRuntimeNodesSimpleQuery,
    runtimeNodesQlArgs,
  )
  const totalNodes =
    runtimeNodes.result?.runtimeNode.runtimeNodes.totalPages ?? 0

  const toNodeTree = useCallback(
    (id: string) => {
      nav(`/runtime-node/${id}/tree`)
    },
    [nav],
  )

  return (
    <div className="flex h-full flex-col justify-between px-5">
      <div>
        <div className="header-1 mb-8">欢迎使用 Spectre</div>
        <div className="grid grid-cols-2 gap-8">
          <Card>
            <CardBody className="overflow-hidden">
              <div className="header-2">快速开始</div>
              <div className="my-3 text-sm">选择任意一个运行节点来连接</div>
              <Table
                removeWrapper
                aria-label="Runtime Nodes"
                bottomContent={
                  totalNodes > 1 ? (
                    <div className="flex w-full justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={runtimeNodesQlArgs.page + 1}
                        total={totalNodes}
                        onChange={(p) =>
                          setRuntimeNodesQlArgs({
                            page: p - 1,
                            size: runtimeNodesQlArgs.size,
                          })
                        }
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>名称</TableColumn>
                  <TableColumn>标签</TableColumn>
                  <TableColumn align="end">操作</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    runtimeNodes.errors
                      ? '加载失败:' + runtimeNodes.errors.join(';')
                      : '没有任何数据'
                  }
                  isLoading={runtimeNodes.isLoading}
                  items={
                    runtimeNodes.result?.runtimeNode.runtimeNodes.result ?? []
                  }
                  loadingContent={<TableLoadingMask />}
                >
                  {(node) => (
                    <TableRow key={node.id}>
                      <TableCell>{node.name}</TableCell>
                      <TableCell>
                        <LabelsDisplay attributes={node.labels} />
                      </TableCell>
                      <TableCell>
                        <Button
                          onPress={() => toNodeTree(node.id)}
                          variant="light"
                          color="primary"
                          size="sm"
                          isIconOnly
                        >
                          <SvgIcon icon={Icon.PLUG} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <div className="header-2">🐞 反馈BUG</div>
              <div className="text-sm">您可以在 GitHub 上提交 Issue</div>
              <div className="text-default-500 text-sm">
                版本: {import.meta.env.VITE_APP_VERSION ?? 'Unknown'}
              </div>
              <Link
                isExternal
                showAnchorIcon
                href="https://github.com/vudsen/spectre/issues/new"
              >
                提交 BUG
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
      {/*<div className="text-default-500 text-center text-sm">*/}
      {/*  <Link*/}
      {/*    color="foreground"*/}
      {/*    size="sm"*/}
      {/*    isExternal*/}
      {/*    showAnchorIcon*/}
      {/*    href="https://github.com/vudsen/spectre"*/}
      {/*  >*/}
      {/*    Spectre Project*/}
      {/*  </Link>*/}
      {/*  <div>{import.meta.env.VITE_APP_VERSION ?? 'Unknown'}</div>*/}
      {/*</div>*/}
    </div>
  )
}

export default Home
