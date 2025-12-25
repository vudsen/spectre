import React, { useState } from 'react'
import {
  Button,
  Drawer,
  DrawerContent,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
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
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import RoleModifyDrawerContent from '@/pages/permission/role/RoleModifyDrawerContent.tsx'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import { useNavigate } from 'react-router'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import Time from '@/components/Time.tsx'

const ListRoleQuery = graphql(`
  query ListRoleQuery($page: Int, $size: Int) {
    role {
      roles(page: $page, size: $size) {
        totalPages
        result {
          id
          name
          description
          createdAt
        }
      }
    }
  }
`)

const pg = { page: 0, size: 10 }

const RolePage: React.FC = () => {
  const roleModifyDrawerClosure = useDisclosure()
  const [page, setPage] = useState(pg)
  const nav = useNavigate()
  const { result, isLoading } = useGraphQL(ListRoleQuery, page)

  const totalPage = result?.role.roles.totalPages ?? 0
  const onModified = () => {
    setPage({ ...page })
  }

  const toRoleDetail = (roleId: string) => {
    nav(`/permission/role/${roleId}`)
  }

  return (
    <div className="mx-6 space-y-3">
      <div className="spectre-heading">角色</div>
      <div className="flex items-center">
        <Input
          size="sm"
          labelPlacement="outside"
          label="搜索"
          placeholder="根据角色名称搜索"
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Button
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          size="sm"
          onPress={roleModifyDrawerClosure.onOpen}
        >
          + 新增
        </Button>
      </div>
      <Table
        removeWrapper
        aria-label="Role Table"
        bottomContent={
          totalPage > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                showControls
                showShadow
                color="primary"
                page={page.page}
                total={totalPage + 1}
                onChange={(p) => setPage({ page: p - 1, size: page.size })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>描述</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={<div>没有可用的角色</div>}
          items={result?.role.roles.result ?? []}
          isLoading={isLoading}
          loadingContent={<TableLoadingMask />}
        >
          {(role) => (
            <TableRow key={role.id}>
              <TableCell>
                <Link
                  size="sm"
                  color="primary"
                  className="cursor-pointer"
                  underline="always"
                  onPress={() => toRoleDetail(role.id)}
                >
                  {role.name}
                </Link>
              </TableCell>
              <TableCell>
                <Time time={role.createdAt} />
              </TableCell>
              <TableCell>{role.description}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly variant="light">
                      <SvgIcon icon={Icon.VERTICAL_DOTS} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="bind-menu-role"
                      onPress={() => toRoleDetail(role.id)}
                    >
                      查看详情
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Drawer
        isOpen={roleModifyDrawerClosure.isOpen}
        onOpenChange={roleModifyDrawerClosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <RoleModifyDrawerContent onClose={onClose} onSave={onModified} />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default RolePage
