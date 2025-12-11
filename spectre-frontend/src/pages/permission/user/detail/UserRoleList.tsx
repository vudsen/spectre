import React, { useState } from 'react'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { unbindRole } from '@/api/impl/role.ts'
import { showDialog } from '@/common/util.ts'
import SelectRoleDrawerContent from '@/pages/permission/user/detail/SelectRoleDrawerContent.tsx'

const UserRoleQuery = graphql(`
  query UserRoleQuery($uid: Long!) {
    role {
      userRoles(userId: $uid) {
        id
        name
        description
      }
    }
  }
`)

interface UserRoleListProps {
  uid: string
}

const UserRoleList: React.FC<UserRoleListProps> = (props) => {
  const [qlParams, setQueryParams] = useState({ uid: props.uid })
  const { result, isLoading } = useGraphQL(UserRoleQuery, qlParams)
  const roles = result?.role.userRoles ?? []
  const roleModifyDrawerClosure = useDisclosure()

  const removeRole = (roleId: string, roleName: string) => {
    showDialog({
      title: `解绑角色 ${roleName}`,
      message: '确定要解绑吗?',
      color: 'danger',
      onConfirm() {
        unbindRole(props.uid, roleId).then(() => {
          addToast({
            title: '解绑成功',
            color: 'success',
          })
          onModified()
        })
      },
    })
  }

  const onModified = () => {
    setQueryParams({ ...qlParams })
  }

  return (
    <>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="header-2">已绑定的角色</div>
            <Button
              variant="flat"
              color="primary"
              onPress={roleModifyDrawerClosure.onOpen}
            >
              绑定新角色
            </Button>
          </div>
          <div className="text-sm">
            用户角色，用于权限的分配与管理。目前暂不支持单独绑定权限到用户上。
          </div>
          <Table removeWrapper>
            <TableHeader>
              <TableColumn>名称</TableColumn>
              <TableColumn>描述</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody
              items={roles}
              isLoading={isLoading}
              loadingContent={<TableLoadingMask />}
              emptyContent="没有绑定任何角色"
            >
              {(role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => removeRole(role.id, role.name)}
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
        isOpen={roleModifyDrawerClosure.isOpen}
        onOpenChange={roleModifyDrawerClosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <SelectRoleDrawerContent
              onClose={onClose}
              onSave={onModified}
              userId={props.uid}
              ownedRoleIds={roles.map((role) => role.id)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default UserRoleList
