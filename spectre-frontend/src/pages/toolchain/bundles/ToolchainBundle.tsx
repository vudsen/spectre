import React, { useCallback, useState } from 'react'
import {
  addToast,
  Button,
  Code,
  Drawer,
  DrawerContent,
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
import ToolchainBundleModifyDrawerContent from './ToolchainBundleModifyDrawerContent.tsx'
import useGraphQL from '@/hook/useGraphQL.ts'
import { showDialog } from '@/common/util.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import type { DocumentResult } from '@/graphql/execute.ts'
import { deleteToolchainBundle } from '@/api/impl/toolchain.ts'
import Time from '@/components/Time.tsx'
import i18n from '@/i18n'

const ToolchainBundleQuery = graphql(`
  query ToolchainBundleQuery($page: Int!, $size: Int!) {
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

type ToolchainBundleResp = DocumentResult<
  typeof ToolchainBundleQuery
>['toolchain']['toolchainBundles']['result'][number]
const ToolchainBundle: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [qlArgs, setQlArgs] = useState({
    page: 0,
    size: 10,
  })
  const [selectedEntity, setSelectedEntity] = useState<ToolchainBundleResp>()
  const { result, isLoading } = useGraphQL(ToolchainBundleQuery, qlArgs)

  const deleteBundle = useCallback((r: ToolchainBundleResp) => {
    showDialog({
      title: i18n.t(
        'hardcoded.msg_pages_toolchain_bundles_toolchainbundle_001',
      ),
      message: i18n.t(
        'hardcoded.msg_pages_toolchain_bundles_toolchainbundle_002',
        {
          name: r.name,
        },
      ),
      color: 'danger',
      onConfirm: async () => {
        await deleteToolchainBundle(r.id)
        addToast({
          title: i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_003',
          ),
          color: 'success',
        })
        setQlArgs((prev) => ({ ...prev }))
      },
    })
  }, [])

  const onModified = () => {
    setQlArgs({ ...qlArgs })
  }

  const editBundle = (r: ToolchainBundleResp) => {
    setSelectedEntity(r)
    console.log(r)
    onOpen()
  }

  const createNew = () => {
    setSelectedEntity(undefined)
    onOpen()
  }

  const bundles = result?.toolchain.toolchainBundles.result ?? []
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
          color="primary"
          className="ml-3 self-end"
          variant="flat"
          size="sm"
          onPress={createNew}
        >
          {i18n.t('hardcoded.msg_pages_permission_role_index_003')}
        </Button>
      </div>
      <Table removeWrapper aria-label="Toolchain bundle">
        <TableHeader>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_labeleditor_index_004')}
          </TableColumn>
          <TableColumn>Arthas</TableColumn>
          <TableColumn>Jattach</TableColumn>
          <TableColumn>
            {i18n.t('hardcoded.msg_components_page_permissionslist_index_010')}
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
        >
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>{bundle.name}</TableCell>
              <TableCell>
                <Code>{bundle.arthasTag}</Code>
              </TableCell>
              <TableCell>
                <Code>{bundle.jattachTag}</Code>
              </TableCell>
              <TableCell>
                <Time time={bundle.createdAt} />
              </TableCell>
              <TableCell
                align="right"
                className="relative flex items-center justify-end gap-2"
              >
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => editBundle(bundle)}
                >
                  <SvgIcon icon={Icon.EDIT} />
                </Button>
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  onPress={() => deleteBundle(bundle)}
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
            <ToolchainBundleModifyDrawerContent
              oldEntity={selectedEntity}
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
