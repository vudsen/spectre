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
import { formatTime } from '@/common/util.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import LabelsDisplay from '../../../components/LabelsDisplay'
import type { DocumentResult } from '@/graphql/execute.ts'
import ModifyPasswordModalContent, {
  type ModifyPasswordData,
} from '@/components/ModifyPasswordModalContent.tsx'
import { modifyUserPassword } from '@/api/impl/user.ts'
import { useNavigate } from 'react-router'

const UserListQuery = graphql(`
  query UserListQuery($page: Int, $size: Int) {
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
      <div className="mb-3 text-xl font-semibold">用户列表</div>
      <div className="flex items-center">
        <Input
          size="sm"
          labelPlacement="outside"
          label="搜索"
          placeholder="根据用户名搜索"
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Button
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          size="sm"
          onPress={() => nav('/permission/user/modify')}
        >
          + 新增
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
                page={page.page}
                total={totalPage}
                onChange={(p) => setPage({ page: p, size: page.size })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>用户名</TableColumn>
          <TableColumn>昵称</TableColumn>
          <TableColumn>属性</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={<div>没有可用的用户</div>}
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
              <TableCell>{formatTime(user.createdAt)}</TableCell>
              <TableCell>
                <Button
                  isIconOnly
                  color="primary"
                  variant="light"
                  onPress={() => onModify(user)}
                >
                  <SvgIcon icon={Icon.EDIT} />
                </Button>
                <Tooltip content="修改密码">
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
