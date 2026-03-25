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
import Guide from '@/pages/home/Guide.tsx'
import i18n from '@/i18n'

const ListRuntimeNodesSimpleQuery = graphql(`
  query ListRuntimeNodesSimpleQuery($page: Int!, $size: Int!) {
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
    <div className="flex flex-col px-5 pb-16">
      <div>
        <div className="header-1 mb-8">
          {i18n.t('hardcoded.msg_pages_home_index_001')}
        </div>
        <div className="grid grid-cols-2 gap-8">
          <Card>
            <CardBody className="overflow-hidden">
              <div className="header-2">
                {i18n.t('hardcoded.msg_pages_home_index_002')}
              </div>
              <div className="my-3 text-sm">
                {i18n.t('hardcoded.msg_pages_home_index_003')}
              </div>
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
                  <TableColumn>
                    {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
                  </TableColumn>
                  <TableColumn>
                    {i18n.t('hardcoded.msg_components_labeleditor_index_001')}
                  </TableColumn>
                  <TableColumn align="end">
                    {i18n.t('common.action')}
                  </TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    runtimeNodes.errors
                      ? i18n.t('hardcoded.msg_pages_home_index_004') +
                        runtimeNodes.errors.join(';')
                      : i18n.t('hardcoded.msg_pages_home_index_005')
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
              <div className="header-2">
                {i18n.t('hardcoded.msg_pages_home_index_006')}
              </div>
              <div className="text-sm">
                {i18n.t('hardcoded.msg_pages_home_index_007')}
              </div>
              <div className="text-default-500 text-sm">
                {i18n.t(
                  'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_002',
                )}{' '}
                {import.meta.env.VITE_APP_VERSION ?? 'Unknown'}
              </div>
              <Link
                isExternal
                showAnchorIcon
                href="https://github.com/vudsen/spectre/issues/new"
              >
                {i18n.t('hardcoded.msg_pages_home_index_008')}
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
      <Guide />
    </div>
  )
}

export default Home
