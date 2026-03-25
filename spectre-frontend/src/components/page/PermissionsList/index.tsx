import { graphql } from '@/graphql/generated'
import React, { useRef, useState } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Code,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { showDialog } from '@/common/util.ts'
import PermissionModifyControl, {
  type PermissionModifyControlRef,
} from '@/components/page/PermissionsList/PermissionModifyControl.tsx'
import Time from '@/components/Time.tsx'
import type { DocumentResult } from '@/graphql/execute.ts'
import { deletePermissionPolicy } from '@/api/impl/permission.ts'
import i18n from '@/i18n'

interface StaticPermissionListProps {
  subjectId: string
  subjectType: string
}

const SubjectPermissionsQuery = graphql(`
  query SubjectPermissionsQuery(
    $subjectId: Long!
    $subjectType: String!
    $page: Int!
    $size: Int!
    $isUser: Boolean!
    $isRole: Boolean!
  ) {
    permission {
      permissions(
        subjectId: $subjectId
        subjectType: $subjectType
        page: $page
        size: $size
      ) {
        totalPages
        result {
          id
          name
          action
          resource
          conditionExpression
          createdAt
          description
        }
      }
    }
    user @include(if: $isUser) {
      user(id: $subjectId) {
        username
        displayName
      }
    }
    role @include(if: $isRole) {
      role(id: $subjectId) {
        name
      }
    }
  }
`)

type PermissionQlResult = DocumentResult<
  typeof SubjectPermissionsQuery
>['permission']['permissions']['result'][number]

const PermissionsList: React.FC<StaticPermissionListProps> = (props) => {
  const [qlArgs, setQlArgs] = useState({
    subjectId: props.subjectId,
    subjectType: props.subjectType,
    page: 0,
    size: 10,
    isUser: props.subjectType === 'USER',
    isRole: props.subjectType === 'ROLE',
  })
  const { isLoading, result } = useGraphQL(SubjectPermissionsQuery, qlArgs)
  const permissionModifyRef = useRef<PermissionModifyControlRef>(null)

  const deletePermissionInner = (permission: PermissionQlResult) => {
    showDialog({
      title: i18n.t('hardcoded.msg_components_page_permissionslist_index_001'),
      message: i18n.t(
        'hardcoded.msg_components_page_permissionslist_index_002',
        {
          name: permission.name,
        },
      ),
      color: 'danger',
      onConfirm: async () => {
        await deletePermissionPolicy(permission.id)
        addToast({
          title: i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_003',
          ),
          color: 'success',
        })
        setQlArgs({ ...qlArgs })
      },
    })
  }

  const onModify = (permission: PermissionQlResult) => {
    permissionModifyRef.current!.onModify(permission)
  }

  const totalPage = result?.permission.permissions.totalPages ?? 0
  return (
    <>
      <Card>
        <CardBody className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="spectre-heading">
              {i18n.t(
                'hardcoded.msg_components_page_permissionslist_index_004',
              )}
            </div>
            <PermissionModifyControl
              {...props}
              ref={permissionModifyRef}
              onModified={() => setQlArgs({ ...qlArgs })}
            />
          </div>
          <div className="my-2 text-sm">
            {i18n.t('hardcoded.msg_components_page_permissionslist_index_005')}
          </div>
          <Input
            size="sm"
            className="my-2"
            labelPlacement="outside"
            label={i18n.t(
              'hardcoded.msg_components_page_permissionslist_index_006',
            )}
            placeholder={i18n.t(
              'hardcoded.msg_components_page_permissionslist_index_007',
            )}
            startContent={<SvgIcon icon={Icon.SEARCH} />}
          />
          <Table
            removeWrapper
            aria-label="Owned Permissions"
            bottomContent={
              totalPage > 1 ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={qlArgs.page + 1}
                    total={totalPage}
                    onChange={(p) => setQlArgs({ ...qlArgs, page: p - 1 })}
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
                {i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_008',
                )}
              </TableColumn>
              <TableColumn>
                {i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_009',
                )}
              </TableColumn>
              <TableColumn>
                {i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_010',
                )}
              </TableColumn>
              <TableColumn align="end">{i18n.t('common.action')}</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={<TableLoadingMask />}
              items={result?.permission.permissions.result ?? []}
              emptyContent={
                <div>
                  {i18n.t(
                    'hardcoded.msg_components_page_permissionslist_index_011',
                  )}
                </div>
              }
            >
              {(permission) => (
                <TableRow key={`${permission.resource}:${permission.action}`}>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>
                    <Code>
                      {permission.resource}:{permission.action}
                    </Code>
                  </TableCell>
                  <TableCell>
                    <Code>{permission.conditionExpression}</Code>
                  </TableCell>
                  <TableCell>
                    <Time time={permission.createdAt} />
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      color="primary"
                      variant="light"
                      size="sm"
                      onPress={() => onModify(permission)}
                    >
                      <SvgIcon icon={Icon.EDIT} />
                    </Button>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => deletePermissionInner(permission)}
                    >
                      <SvgIcon icon={Icon.TRASH} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </>
  )
}

export default PermissionsList
