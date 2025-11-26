import React from 'react'
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
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import { formatTime } from '@/common/util.ts'
import ToolchainItemModifyDrawerContent from './ToolchainItemModifyDrawerContent'
import type { ToolchainItemType } from '@/pages/settings/toolchain/ToolchainItemType.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'

const ToolchainItemsQuery = graphql(`
  query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {
    toolchain {
      toolchainItems(type: $type, page: $page, size: $size) {
        totalPages
        result {
          id {
            type
            tag
          }
          url
          createdAt
        }
      }
    }
  }
`)

interface ToolChainItemsProps {
  type: ToolchainItemType
}

const ToolChainItems: React.FC<ToolChainItemsProps> = (props) => {
  const [args, setArgs] = React.useState({
    page: 0,
    size: 10,
    type: props.type.type,
  })
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { isLoading, result } = useGraphQL(ToolchainItemsQuery, args)
  if (!result && !isLoading) {
    return <div>Unknown error!</div>
  }

  const onModified = () => {
    setArgs({ ...args })
  }

  const itemArray = result ? result.toolchain.toolchainItems.result : []
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
          size="sm"
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          onPress={onOpen}
        >
          + 新增
        </Button>
      </div>
      <Table
        aria-label="Toolchain list"
        removeWrapper
        bottomContent={
          result && itemArray.length > 0 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={args.page}
                total={result.toolchain.toolchainItems.totalPages}
                onChange={(page) => setArgs({ ...args, page })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>标签</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>URL</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={<div>没有可用数据</div>}
          loadingContent={<TableLoadingMask />}
        >
          {itemArray.map((item) => (
            <TableRow key={item.id.tag}>
              <TableCell>{item.id.tag}</TableCell>
              <TableCell>{formatTime(item.createdAt)}</TableCell>
              <TableCell>
                <Link size="sm" isExternal href={item.url}>
                  {item.url}
                </Link>
              </TableCell>
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
            <ToolchainItemModifyDrawerContent
              type={props.type.type}
              onClose={onClose}
              onModified={onModified}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default ToolChainItems
