import {
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
  Input,
  Link,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import React, { useCallback, useState } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import LabelsDisplay from '@/components/LabelsDisplay'
import { graphql } from '@/graphql/generated'
import SelectUserDrawerContent from './SelectUserDrawerContent.tsx'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { useNavigate } from 'react-router'

const RoleBoundUserQuery = graphql(`
  query RoleBoundUserQuery($roleId: Long!, $page: Int, $size: Int) {
    role {
      role(id: $roleId) {
        name
      }
      boundUsers(roleId: $roleId, page: $page, size: $size) {
        totalPages
        result {
          id
          username
          displayName
          labels
        }
      }
    }
  }
`)

interface RoleUserListProps {
  roleId: string
}

const RoleUserList: React.FC<RoleUserListProps> = (props) => {
  const subjectId = props.roleId
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [qlParams, setQlParams] = useState({
    roleId: subjectId,
    page: 0,
    size: 10,
  })
  const { isLoading, result } = useGraphQL(RoleBoundUserQuery, qlParams)
  const nav = useNavigate()
  const totalPage = result?.role.boundUsers.totalPages ?? 0

  const refresh = () => {
    setQlParams({ ...qlParams })
  }

  const toUserPage = useCallback(
    (userId: string) => {
      nav(`/permission/user/${userId}`)
    },
    [nav],
  )

  const users = result?.role.boundUsers.result ?? []
  const userIds = users.map((u) => u.id)

  return (
    <>
      <Card>
        <CardBody className="overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="spectre-heading">角色中的用户</div>
            <div className="flex items-center">
              <Button
                isIconOnly
                color="primary"
                className="mx-2"
                variant="flat"
                onPress={refresh}
              >
                <SvgIcon icon={Icon.REFRESH} />
              </Button>
              <Button color="primary" variant="flat" onPress={onOpen}>
                添加用户
              </Button>
            </div>
          </div>
          <div>
            <Input
              className="my-2"
              size="sm"
              labelPlacement="outside"
              label="搜索"
              placeholder="搜索用户"
              startContent={<SvgIcon icon={Icon.SEARCH} />}
            />
            <Table
              aria-label="Bound users"
              removeWrapper
              bottomContent={
                totalPage > 1 ? (
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={qlParams.page}
                      total={totalPage}
                      onChange={(p) => setQlParams({ ...qlParams, page: p })}
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn>用户名</TableColumn>
                <TableColumn>昵称</TableColumn>
                <TableColumn>标签</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={<div>没有绑定任何用户</div>}
                isLoading={isLoading}
                items={users}
                loadingContent={<TableLoadingMask />}
              >
                {(user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        color="primary"
                        underline="always"
                        size="sm"
                        className="cursor-pointer"
                        onPress={() => toUserPage(user.id)}
                      >
                        {user.username}
                      </Link>
                    </TableCell>
                    <TableCell>{user.displayName ?? '-'}</TableCell>
                    <TableCell>
                      <LabelsDisplay attributes={user.labels} />
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                      >
                        <SvgIcon icon={Icon.TRASH} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="5xl">
        <DrawerContent>
          {(onClose) => (
            <SelectUserDrawerContent
              boundUserIds={userIds}
              roleId={subjectId}
              onClose={onClose}
              onSave={refresh}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default RoleUserList
