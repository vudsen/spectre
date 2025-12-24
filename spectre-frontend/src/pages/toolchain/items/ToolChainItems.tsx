import React, { useCallback, useState } from 'react'
import {
  addToast,
  Button,
  Code,
  Drawer,
  DrawerContent,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
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
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import { showDialog } from '@/common/util.ts'
import ToolchainItemModifyDrawerContent from './ToolchainItemModifyDrawerContent'
import type { ToolchainItemType } from './ToolchainItemType.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import type { DocumentResult } from '@/graphql/execute.ts'
import UploadToolchainModalContent from './UploadToolchainModalContent.tsx'
import { deleteToolchainItem } from '@/api/impl/toolchain.ts'
import Time from '@/components/Time.tsx'

const ToolchainItemsQuery = graphql(`
  query ToolchainItemsQuery($type: ToolchainType!, $page: Int, $size: Int) {
    toolchain {
      toolchainItemsV2(type: $type, page: $page, size: $size) {
        totalPages
        result {
          type
          tag
          createdAt
          isArmCached
          isX86Cached
          url
          armUrl
        }
      }
    }
  }
`)

type ToolchainItemResponseVO = DocumentResult<
  typeof ToolchainItemsQuery
>['toolchain']['toolchainItemsV2']['result'][number]

interface ToolchainCacheStatusLinkProps {
  isCached: boolean
  isUnavailable?: boolean
  onUploadPress: () => void
}

const ToolchainCacheStatusLink: React.FC<ToolchainCacheStatusLinkProps> = (
  props,
) => {
  if (props.isUnavailable) {
    return <span className="italic">Unavailable</span>
  }
  if (props.isCached) {
    return <span className="text-success bold">true</span>
  }
  return (
    <div className="flex items-center">
      <Tooltip content="服务器本地未缓存该包，可以手动上传(该功能仅限单机部署)，也可以在后面使用到时，自动从 url 下载">
        <SvgIcon icon={Icon.NOTE} className="text-warning" />
      </Tooltip>
      <Link
        underline="always"
        color="warning"
        className="ml-1 cursor-pointer"
        onPress={props.onUploadPress}
      >
        false
      </Link>
    </div>
  )
}

interface ToolChainItemsProps {
  type: ToolchainItemType
}

type UploadArgs = {
  type: string
  tag: string
  isArm: boolean
}
const initial: UploadArgs = {
  type: '',
  tag: '',
  isArm: false,
}

const ToolChainItems: React.FC<ToolChainItemsProps> = (props) => {
  const [args, setArgs] = React.useState({
    page: 0,
    size: 10,
    type: props.type.type,
  })
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const uploadModal = useDisclosure()
  const viewModal = useDisclosure()
  const { isLoading, result } = useGraphQL(ToolchainItemsQuery, args)
  const [uploadArgs, setUploadArgs] = useState(initial)
  const [selectedItem, setSelectedItem] = useState<
    ToolchainItemResponseVO | undefined
  >()

  const onModified = () => {
    setArgs({ ...args })
  }

  const itemArray = result ? result.toolchain.toolchainItemsV2.result : []
  const uploadPkg = (vo: ToolchainItemResponseVO, isArm: boolean) => {
    setUploadArgs({
      tag: vo.tag,
      type: vo.type,
      isArm,
    })
    uploadModal.onOpen()
  }

  const deleteItem = useCallback((r: ToolchainItemResponseVO) => {
    showDialog({
      title: '删除工具',
      message: `确定删除 ${r.type} ${r.tag} 吗?`,
      color: 'danger',
      onConfirm() {
        deleteToolchainItem(r).then(() => {
          addToast({
            title: '删除成功',
            color: 'success',
          })
          setArgs((prev) => ({ ...prev }))
        })
      },
    })
  }, [])

  const viewItem = useCallback(
    (r: ToolchainItemResponseVO) => {
      setSelectedItem(r)
      viewModal.onOpen()
    },
    [viewModal],
  )

  if (!result && !isLoading) {
    return <div>Unknown error!</div>
  }
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
          result && itemArray.length > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={args.page + 1}
                total={result.toolchain.toolchainItemsV2.totalPages}
                onChange={(page) => setArgs({ ...args, page: page - 1 })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>标签</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>x86 包缓存状态</TableColumn>
          <TableColumn>ARM 包缓存状态</TableColumn>
          <TableColumn align="end">操作</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={<div>没有可用数据</div>}
          loadingContent={<TableLoadingMask />}
        >
          {itemArray.map((item) => (
            <TableRow key={item.tag}>
              <TableCell>
                <Code>{item.tag}</Code>
              </TableCell>
              <TableCell>
                <Time time={item.createdAt} />
              </TableCell>
              <TableCell
                className={item.isX86Cached ? 'text-success' : 'text-warning'}
              >
                <ToolchainCacheStatusLink
                  isCached={item.isX86Cached}
                  onUploadPress={() => uploadPkg(item, false)}
                />
              </TableCell>
              <TableCell>
                <ToolchainCacheStatusLink
                  onUploadPress={() => uploadPkg(item, true)}
                  isCached={item.isArmCached}
                  isUnavailable={!props.type.hasMultiplatformBundle}
                />
              </TableCell>
              <TableCell
                align="right"
                className="relative flex items-center justify-end gap-2"
              >
                <Button
                  variant="light"
                  isIconOnly
                  onPress={() => viewItem(item)}
                >
                  <SvgIcon icon={Icon.VIEW} />
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  isIconOnly
                  onPress={() => deleteItem(item)}
                >
                  <SvgIcon icon={Icon.TRASH} />
                </Button>
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
      <Modal
        isOpen={uploadModal.isOpen}
        onOpenChange={uploadModal.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <UploadToolchainModalContent
              {...uploadArgs}
              onClose={onClose}
              onModified={onModified}
            />
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>工具详情</ModalHeader>
              <ModalBody className="break-all">
                <div>
                  <span>标签: </span>
                  <span className="text-default-500 text-sm">
                    {selectedItem?.tag}
                  </span>
                </div>
                <div>
                  <span>x86下载地址: </span>
                  <Link
                    href={selectedItem?.url}
                    isExternal
                    className="text-default-500 text-sm"
                    underline="hover"
                  >
                    {selectedItem?.url}
                  </Link>
                </div>
                <div>
                  <span>arm下载地址: </span>
                  {selectedItem && selectedItem.armUrl ? (
                    <Link
                      href={selectedItem.armUrl}
                      isExternal
                      className="text-default-500 text-sm"
                      underline="hover"
                    >
                      {selectedItem.armUrl}
                    </Link>
                  ) : (
                    <span className="text-default-500 text-sm italic">
                      Unavailable
                    </span>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <div>
                  <Button color="primary" onPress={onClose}>
                    确定
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default ToolChainItems
