import { graphql } from '@/graphql/generated'
import React, { useCallback, useState } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import {
  Button,
  Input,
  Link,
  Modal,
  ModalContent,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import LabelsDisplay from '../../../components/LabelsDisplay'
import type { DocumentResult } from '@/graphql/execute.ts'
import ModifyPasswordModalContent, {
  type ModifyPasswordData,
} from '@/components/ModifyPasswordModalContent.tsx'
import { modifyUserPassword } from '@/api/impl/user.ts'
import { useNavigate } from 'react-router'
import Time from '@/components/Time.tsx'
import i18n from '@/i18n'

const UserListQuery = graphql(`
  query UserListQuery($page: Int!, $size: Int!) {
    user {
      users(page: $page, size: $size) {
        totalPages
        result {
          id
          createdAt
          displayName
          username
          labels
        }
      }
    }
  }
`)
const pg = { page: 0, size: 10 }

type UserResult = DocumentResult<
  typeof UserListQuery
>['user']['users']['result'][number]

const UserListPage: React.FC = () => {
  const [page, setPage] = useState(pg)
  const passwordModifyDisclosure = useDisclosure()
  const { result, isLoading } = useGraphQL(UserListQuery, page)
  const totalPage = result?.user.users.totalPages ?? 0
  const [selectedUser, setSelectedUser] = useState<UserResult>()
  const nav = useNavigate()

  const onModify = (user: UserResult) => {
    nav(`/permission/user/modify?uid=${user.id}`)
  }

  const onModifyPassword = (user: UserResult) => {
    setSelectedUser(user)
    passwordModifyDisclosure.onOpen()
  }

  const sendModifyPasswordReq = useCallback(
    (data: ModifyPasswordData, user: UserResult) => {
      return modifyUserPassword({
        userId: user.id,
        newPassword: data.newPassword,
      })
    },
    [],
  )

  const toDetail = (userId: string) => {
    nav(`/permission/user/${userId}`)
  }

  return (
    <div className="mx-6 space-y-3">
      <div className="mb-3 text-xl font-semibold">
        {i18n.t('hardcoded.msg_pages_permission_user_index_001')}
      </div>
      <div className="flex items-center">
        <Input
          size="sm"
          labelPlacement="outside"
          label={i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_006',
          )}
          placeholder={i18n.t('hardcoded.msg_pages_permission_user_index_002')}
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Button
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          size="sm"
          onPress={() => nav('/permission/user/modify')}
        >
          {i18n.t('hardcoded.msg_pages_permission_role_index_003')}
        </Button>
      </div>
      <Table
        removeWrapper
        aria-label="User list"
        bottomContent={
          totalPage > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page.page + 1}
                total={totalPage}
                onChange={(p) => setPage({ page: p - 1, size: page.size })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>{i18n.t('common.username')}</TableColumn>
          <TableColumn>
            {i18n.t(
              'hardcoded.msg_pages_permission_role_param_roleuserlist_004',
            )}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_pages_permission_user_index_003')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_page_permissionslist_index_010')}
          </TableColumn>
          <TableColumn align="end">{i18n.t('common.action')}</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div>{i18n.t('hardcoded.msg_pages_permission_user_index_004')}</div>
          }
          isLoading={isLoading}
          items={result?.user.users.result ?? []}
          loadingContent={
            <div>
              <Skeleton className="w-full rounded-lg">
                <div className="bg-default-300 h-3 w-full rounded-lg" />
              </Skeleton>
            </div>
          }
        >
          {(user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link
                  onPress={() => toDetail(user.id)}
                  size="sm"
                  underline="always"
                  color="primary"
                  className="cursor-pointer"
                >
                  {user.username}
                </Link>
              </TableCell>
              <TableCell>{user.displayName ?? '-'}</TableCell>
              <TableCell>
                <LabelsDisplay attributes={user.labels} />
              </TableCell>
              <TableCell>
                <Time time={user.createdAt} />
              </TableCell>
              <TableCell>
                <Button
                  isIconOnly
                  color="primary"
                  variant="light"
                  onPress={() => onModify(user)}
                >
                  <SvgIcon icon={Icon.EDIT} />
                </Button>
                <Tooltip
                  content={i18n.t(
                    'hardcoded.msg_components_modifypasswordmodalcontent_003',
                  )}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    color="primary"
                    onPress={() => onModifyPassword(user)}
                  >
                    <SvgIcon icon={Icon.SECRET_KEY} />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Modal
        isOpen={passwordModifyDisclosure.isOpen}
        onOpenChange={passwordModifyDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <ModifyPasswordModalContent
              userId={selectedUser!.id}
              onClose={onClose}
              modifyPassword={(data) =>
                sendModifyPasswordReq(data, selectedUser!)
              }
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default UserListPage
