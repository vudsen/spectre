import React, { useRef, useState } from 'react'
import {
  addToast,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Input,
  type Selection,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import { bindRoleToUser } from '@/api/impl/role.ts'
import i18n from '@/i18n'

const ListRoleWithNameQuery = graphql(`
  query ListRoleWithNameQuery($name: String!) {
    role {
      searchRoleByName(name: $name) {
        result {
          id
          name
          description
        }
      }
    }
  }
`)

interface SelectRoleDrawerContentProps {
  onClose: () => void
  userId: string
  onSave: () => void
  ownedRoleIds?: string[]
}
const SelectRoleDrawerContent: React.FC<SelectRoleDrawerContentProps> = (
  props,
) => {
  const [qlArgs, setQlArgs] = useState({
    name: '',
  })
  const { result, isLoading } = useGraphQL(ListRoleWithNameQuery, qlArgs)
  const taskId = useRef<undefined | number>(undefined)
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set())
  const [isSubmitting, setSubmitting] = useState(false)

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (taskId.current) {
      clearTimeout(taskId.current)
    }
    taskId.current = setTimeout(() => {
      setQlArgs({
        name: e.target.value,
      })
    }, 400)
  }

  const onSave = async () => {
    setSubmitting(true)
    try {
      if (selectedKeys === 'all') {
        await bindRoleToUser({
          roleIds: result!.role.searchRoleByName.result.map((role) => role.id),
          userIds: [props.userId],
        })
      } else if (selectedKeys.size == 0) {
        addToast({
          title: i18n.t(
            'hardcoded.msg_pages_permission_role_param_selectuserdrawercontent_001',
          ),
          color: 'danger',
        })
      } else {
        const ids: string[] = []
        for (const selectedKey of selectedKeys) {
          ids.push(selectedKey as string)
        }
        await bindRoleToUser({
          roleIds: ids,
          userIds: [props.userId],
        })
      }
      addToast({
        title: i18n.t(
          'hardcoded.msg_pages_permission_role_param_selectuserdrawercontent_002',
        ),
        color: 'success',
      })
      props.onSave()
      props.onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DrawerHeader>
        {i18n.t(
          'hardcoded.msg_pages_permission_user_param_selectroledrawercontent_001',
        )}
      </DrawerHeader>
      <DrawerBody>
        <Input
          size="sm"
          labelPlacement="outside"
          label={i18n.t(
            'hardcoded.msg_components_page_permissionslist_index_006',
          )}
          placeholder={i18n.t(
            'hardcoded.msg_pages_permission_user_param_selectroledrawercontent_002',
          )}
          onChange={onChange}
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Table
          onSelectionChange={setSelectedKeys}
          removeWrapper
          disabledKeys={props.ownedRoleIds}
          aria-label="User List"
          selectionMode="multiple"
          color="primary"
        >
          <TableHeader>
            <TableColumn>
              {i18n.t(
                'hardcoded.msg_pages_permission_role_rolemodifydrawercontent_003',
              )}
            </TableColumn>
            <TableColumn>
              {i18n.t(
                'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_007',
              )}
            </TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<TableLoadingMask />}
            items={result?.role.searchRoleByName.result ?? []}
            emptyContent={i18n.t(
              'hardcoded.msg_pages_permission_user_param_selectroledrawercontent_003',
            )}
          >
            {(role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description ?? '-'}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DrawerBody>
      <DrawerFooter>
        <Button
          color="danger"
          variant="light"
          disabled={isSubmitting}
          onPress={props.onClose}
        >
          Close
        </Button>
        <Button color="primary" isLoading={isSubmitting} onPress={onSave}>
          {i18n.t('common.save')}
        </Button>
      </DrawerFooter>
    </>
  )
}

export default SelectRoleDrawerContent
