import React, { useCallback, useState } from 'react'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
  Link,
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
import SelectRoleDrawerContent from './SelectRoleDrawerContent.tsx'
import { useNavigate } from 'react-router'
import i18n from '@/i18n'

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
  const nav = useNavigate()

  const removeRole = (roleId: string, roleName: string) => {
    showDialog({
      title: i18n.t(
        'hardcoded.msg_pages_permission_user_param_userrolelist_001',
        { roleName },
      ),
      message: i18n.t(
        'hardcoded.msg_pages_permission_user_param_userrolelist_002',
      ),
      color: 'danger',
      onConfirm() {
        unbindRole(props.uid, roleId).then(() => {
          addToast({
            title: i18n.t(
              'hardcoded.msg_pages_permission_user_param_userrolelist_003',
            ),
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

  const toRolePage = useCallback(
    (roleId: string) => {
      nav(`/permission/role/${roleId}`)
    },
    [nav],
  )

  return (
    <>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="header-2">
              {i18n.t(
                'hardcoded.msg_pages_permission_user_param_userrolelist_004',
              )}
            </div>
            <Button
              variant="flat"
              color="primary"
              onPress={roleModifyDrawerClosure.onOpen}
            >
              {i18n.t(
                'hardcoded.msg_pages_permission_user_param_userrolelist_005',
              )}
            </Button>
          </div>
          <div className="text-sm">
            {i18n.t(
              'hardcoded.msg_pages_permission_user_param_userrolelist_006',
            )}
          </div>
          <Table removeWrapper>
            <TableHeader>
              <TableColumn>
                {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
              </TableColumn>
              <TableColumn>
                {i18n.t(
                  'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_007',
                )}
              </TableColumn>
              <TableColumn>{i18n.t('common.action')}</TableColumn>
            </TableHeader>
            <TableBody
              items={roles}
              isLoading={isLoading}
              loadingContent={<TableLoadingMask />}
              emptyContent={i18n.t(
                'hardcoded.msg_pages_permission_user_param_userrolelist_007',
              )}
            >
              {(role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Link
                      color="primary"
                      underline="always"
                      size="sm"
                      className="cursor-pointer"
                      onPress={() => toRolePage(role.id)}
                    >
                      {role.name}
                    </Link>
                  </TableCell>
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
