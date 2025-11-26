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
import { graphql } from '@/graphql/generated'
import ToolchainBundleModifyDrawerContent from '@/pages/settings/toolchain-bundle/ToolchainBundleModifyDrawerContent.tsx'
import useGraphQL from '@/hook/useGraphQL.ts'
import { formatTime } from '@/common/util.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'

const ToolchainBundleQuery = graphql(`
  query ToolchainBundleQuery($page: Int, $size: Int) {
    toolchain {
      toolchainBundles(page: $page, size: $size) {
        result {
          id
          name
          createdAt
          jattachTag
          arthasTag
        }
      }
    }
  }
`)

const ToolchainBundle: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [qlArgs, setQlArgs] = useState({
    page: 0,
    size: 10,
  })
  const { result, isLoading } = useGraphQL(ToolchainBundleQuery, qlArgs)

  const onModified = () => {
    setQlArgs({ ...qlArgs })
  }
  const bundles = result?.toolchain.toolchainBundles.result ?? []
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Input
          size="sm"
          labelPlacement="outside"
          label="搜索"
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Button
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          size="sm"
          onPress={onOpen}
        >
          + 新增
        </Button>
      </div>
      <Table removeWrapper>
        <TableHeader>
          <TableColumn>名称</TableColumn>
          <TableColumn>Arthas</TableColumn>
          <TableColumn>Jattach</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={<div>没有可用数据</div>}
          loadingContent={<TableLoadingMask />}
        >
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>{bundle.name}</TableCell>
              <TableCell>{bundle.arthasTag}</TableCell>
              <TableCell>{bundle.jattachTag}</TableCell>
              <TableCell>{formatTime(bundle.createdAt)}</TableCell>
              <TableCell
                align="right"
                className="relative flex items-center justify-end gap-2"
              >
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <SvgIcon icon={Icon.VERTICAL_DOTS} size={24} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Static Actions">
                    <DropdownItem key="detail">查看详情</DropdownItem>
                    <DropdownItem key="update">更新</DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                    >
                      删除
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(onClose) => (
            <ToolchainBundleModifyDrawerContent
              onClose={onClose}
              onModified={onModified}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default ToolchainBundle
