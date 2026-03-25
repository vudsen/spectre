import React, { useCallback, useContext, useState } from 'react'
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
import { ToolchainItemsContext } from '@/pages/toolchain/items/context.ts'
import i18n from '@/i18n'

const ToolchainItemsQuery = graphql(`
  query ToolchainItemsQuery($type: ToolchainType!, $page: Int!, $size: Int!) {
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
  id?: string
}

const ToolchainCacheStatusLink: React.FC<ToolchainCacheStatusLinkProps> = (
  props,
) => {
  if (props.isUnavailable) {
    return (
      <span className="italic" id={props.id}>
        Unavailable
      </span>
    )
  }
  if (props.isCached) {
    return (
      <span className="text-success bold" id={props.id}>
        true
      </span>
    )
  }
  return (
    <div className="flex items-center">
      <Tooltip
        classNames={{ content: 'max-w-48 break-all' }}
        content={i18n.t(
          'hardcoded.msg_pages_toolchain_items_toolchainitems_001',
        )}
      >
        <SvgIcon icon={Icon.NOTE} className="text-warning" />
      </Tooltip>
      <Link
        id={props.id}
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
  downloadUrl: string
}
const initial: UploadArgs = {
  type: '',
  tag: '',
  isArm: false,
  downloadUrl: '',
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
  const context = useContext(ToolchainItemsContext)
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
      downloadUrl: (isArm ? vo.armUrl : vo.url) ?? '',
    })
    uploadModal.onOpen()
  }

  const deleteItem = useCallback((r: ToolchainItemResponseVO) => {
    showDialog({
      title: i18n.t('hardcoded.msg_pages_toolchain_items_toolchainitems_002'),
      message: i18n.t(
        'hardcoded.msg_pages_toolchain_items_toolchainitems_003',
        {
          name: `${r.type}:${r.tag}`,
        },
      ),
      color: 'danger',
      onConfirm() {
        deleteToolchainItem(r).then(() => {
          addToast({
            title: i18n.t(
              'hardcoded.msg_components_page_permissionslist_index_003',
            ),
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
      if (context.tour) {
        if (context.tour.currentStep?.id === 'view-toolchain') {
          context.tour.hide()
        }
      }
    },
    [context.tour, viewModal],
  )

  const onDetailClose = useCallback(() => {
    if (context.tour) {
      if (context.tour.currentStep?.id === 'view-toolchain') {
        context.tour.next()
      }
    }
  }, [context.tour])

  if (!result && !isLoading) {
    return <div>Unknown error!</div>
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Input
          size="sm"
          labelPlacement="outside"
          label={i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_006',
          )}
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Button
          size="sm"
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          onPress={onOpen}
        >
          {i18n.t('hardcoded.msg_pages_permission_role_index_003')}
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
          <TableColumn>
            {i18n.t('hardcoded.msg_components_labeleditor_index_001')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_page_permissionslist_index_010')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_pages_toolchain_items_toolchainitems_004')}
          </TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_pages_toolchain_items_toolchainitems_005')}
          </TableColumn>
          <TableColumn align="end">{i18n.t('common.action')}</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={
            <div>
              {i18n.t(
                'hardcoded.msg_pages_toolchain_bundles_toolchainbundle_003',
              )}
            </div>
          }
          loadingContent={<TableLoadingMask />}
          id={props.type.type}
        >
          {itemArray.map((item, index) => (
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
                  id={
                    index === 0 && props.type.type === 'ARTHAS'
                      ? 'cache-status'
                      : undefined
                  }
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
                  id={
                    index === 0 && props.type.type === 'ARTHAS'
                      ? 'view-arthas'
                      : undefined
                  }
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
      <Modal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        onClose={onDetailClose}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {i18n.t(
                  'hardcoded.msg_pages_toolchain_items_toolchainitems_006',
                )}
              </ModalHeader>
              <ModalBody className="break-all">
                <div>
                  <span>
                    {i18n.t(
                      'hardcoded.msg_pages_toolchain_items_toolchainitems_007',
                    )}{' '}
                  </span>
                  <span className="text-default-500 text-sm">
                    {selectedItem?.tag}
                  </span>
                </div>
                <div>
                  <span>
                    {i18n.t(
                      'hardcoded.msg_pages_toolchain_items_toolchainitems_008',
                    )}{' '}
                  </span>
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
                  <span>
                    {i18n.t(
                      'hardcoded.msg_pages_toolchain_items_toolchainitems_009',
                    )}{' '}
                  </span>
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
                    {i18n.t('common.confirm')}
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
