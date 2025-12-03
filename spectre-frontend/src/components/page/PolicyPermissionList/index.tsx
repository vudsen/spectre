import React, { useCallback } from 'react'
import { useState } from 'react'
import { graphql } from '@/graphql/generated'
import type { DocumentResult } from '@/graphql/execute.ts'
import useGraphQL from '@/hook/useGraphQL.ts'
import {
  Button,
  Card,
  CardBody,
  Code,
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
import { formatTime } from '@/common/util.ts'
import BindPolicyPermissionDrawer from '@/components/page/PolicyPermissionList/BindPolicyPermissionDrawer.tsx'
import ModifyPermissionDrawerContent from '@/components/page/PolicyPermissionList/ModifyPermissionDrawerContent.tsx'

interface PolicyPermissionListProps {
  subjectId: string
  subjectType: string
}

const PolicyPermissionsQuery = graphql(`
  query PolicyPermissionsQuery(
    $subjectType: String
    $subjectId: Long!
    $page: Int
    $size: Int
    $isUser: Boolean!
    $isRole: Boolean!
  ) {
    policyPermission {
      permissions(
        subjectType: $subjectType
        subjectId: $subjectId
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

type Permission = DocumentResult<
  typeof PolicyPermissionsQuery
>['policyPermission']['permissions']['result'][number]

const PolicyPermissionList: React.FC<PolicyPermissionListProps> = (props) => {
  const [qlArgs, setQlArgs] = useState({
    subjectId: props.subjectId!,
    subjectType: props.subjectType!,
    page: 0,
    size: 10,
    isUser: props.subjectType === 'USER',
    isRole: props.subjectType === 'ROLE',
  })
  const { result, isLoading } = useGraphQL(PolicyPermissionsQuery, qlArgs)
  const { onOpen, isOpen, onOpenChange } = useDisclosure()
  const updatePermissionDisclosure = useDisclosure()
  const [selectedPermission, setSelectedPermission] = useState<Permission>()

  const totalPage = result?.policyPermission.permissions.totalPages ?? 0
  const onModify = (permission: Permission) => {
    setSelectedPermission(permission)
    updatePermissionDisclosure.onOpen()
  }

  const refreshTable = useCallback(() => {
    setQlArgs((prev) => ({
      ...prev,
    }))
  }, [])
  return (
    <>
      <Card>
        <CardBody className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="spectre-heading">策略权限</div>
            <Button
              color="primary"
              variant="bordered"
              size="sm"
              onPress={onOpen}
            >
              新增
            </Button>
          </div>
          <div className="my-2 text-sm">
            策略权限，支持通过 SpEL 进行更精细的权限控制。
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
              <TableColumn>表达式</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>描述</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={'没有任何权限'}
              items={result?.policyPermission.permissions.result ?? []}
              isLoading={isLoading}
              loadingContent={<TableLoadingMask />}
            >
              {(permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>
                    <Code>{permission.conditionExpression}</Code>
                  </TableCell>
                  <TableCell>{formatTime(permission.createdAt)}</TableCell>
                  <TableCell>{permission.description ?? '-'}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      variant="light"
                      color="primary"
                      size="sm"
                      onPress={() => onModify(permission)}
                    >
                      <SvgIcon icon={Icon.EDIT} />
                    </Button>
                    <Button isIconOnly variant="light" color="danger" size="sm">
                      <SvgIcon icon={Icon.TRASH} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      <BindPolicyPermissionDrawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onModified={refreshTable}
        subjectId={props.subjectId!}
      />
      <Drawer
        size="xl"
        isOpen={updatePermissionDisclosure.isOpen}
        onOpenChange={updatePermissionDisclosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <ModifyPermissionDrawerContent
                onModified={refreshTable}
                permissionName={selectedPermission!.name}
                subjectId={props.subjectId!}
                onClose={onClose}
                permission={selectedPermission!}
                oldPermission={selectedPermission!}
              />
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default PolicyPermissionList
