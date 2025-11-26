import { graphql } from '@/graphql/generated'
import React, { useCallback, useState } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { showDialog } from '@/common/util.ts'
import { saveStaticPermissions } from '@/api/impl/static-permission.ts'
import BindAclPermissionDrawerContent from './BindAclPermissionDrawerContent.tsx'

interface StaticPermissionListProps {
  subjectId: string
  subjectType: string
}

const SubjectPermissionsQuery = graphql(`
  query SubjectPermissionsQuery(
    $subjectId: Long!
    $subjectType: String!
    $page: Int
    $size: Int
    $isUser: Boolean!
    $isRole: Boolean!
  ) {
    staticPermission {
      permissions(
        subjectId: $subjectId
        subjectType: $subjectType
        page: $page
        size: $size
      ) {
        totalPages
        result {
          name
          action
          resource
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

type PermissionQlResult = {
  name: string
  action: string
  resource: string
}

const StaticPermissionList: React.FC<StaticPermissionListProps> = (props) => {
  const permissionBindDrawerClosure = useDisclosure()
  const [qlArgs, setQlArgs] = useState({
    subjectId: props.subjectId,
    subjectType: props.subjectType,
    page: 0,
    size: 10,
    isUser: props.subjectType === 'USER',
    isRole: props.subjectType === 'ROLE',
  })
  const { isLoading, result } = useGraphQL(SubjectPermissionsQuery, qlArgs)

  const onSave = useCallback(() => {
    setQlArgs((prev) => ({ ...prev }))
  }, [])

  const deletePermission = (permission: PermissionQlResult) => {
    showDialog({
      title: '删除权限',
      message: `确定删除权限 '${permission.name}' 吗?`,
      color: 'danger',
      onConfirm: async () => {
        await saveStaticPermissions([
          {
            subjectType: props.subjectType!,
            subjectId: props.subjectId!,
            enabled: false,
            resource: permission.resource,
            action: permission.action,
          },
        ])
        addToast({
          title: '删除成功',
          color: 'success',
        })
        setQlArgs({ ...qlArgs })
      },
    })
  }
  const totalPage = result?.staticPermission.permissions.totalPages ?? 0
  return (
    <>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="spectre-heading">静态权限</div>
            <Button
              color="primary"
              variant="bordered"
              size="sm"
              onPress={permissionBindDrawerClosure.onOpen}
            >
              新增
            </Button>
          </div>
          <div className="my-2 text-sm">
            静态权限，一般是菜单权限，主要和菜单操作有关，提供最基础的访问控制。
          </div>
          <Input
            size="sm"
            className="my-2"
            labelPlacement="outside"
            label="搜索"
            placeholder="搜索权限"
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
                    page={qlArgs.page}
                    total={totalPage}
                    onChange={(p) => setQlArgs({ ...qlArgs, page: p })}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>名称</TableColumn>
              <TableColumn>资源名称</TableColumn>
              <TableColumn>操作类型</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={<TableLoadingMask />}
              items={result?.staticPermission.permissions.result ?? []}
              emptyContent={<div>没有任何权限</div>}
            >
              {(permission) => (
                <TableRow key={`${permission.resource}:${permission.action}`}>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>{permission.resource}</TableCell>
                  <TableCell>{permission.action}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => deletePermission(permission)}
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
      <Drawer
        size="5xl"
        isOpen={permissionBindDrawerClosure.isOpen}
        onOpenChange={permissionBindDrawerClosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <BindAclPermissionDrawerContent
              onSave={onSave}
              subjectId={props.subjectId}
              subjectType={props.subjectType}
              onClose={onClose}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default StaticPermissionList
