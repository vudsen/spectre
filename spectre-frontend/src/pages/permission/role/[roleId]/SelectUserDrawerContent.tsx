import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type Selection,
  addToast,
} from '@heroui/react'
import React, { useRef, useState } from 'react'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LabelsDisplay from '@/components/LabelsDisplay'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { bindRoleToUser } from '@/api/impl/role.ts'

const ListUserWithUsernameQuery = graphql(`
  query ListUserWithUsernameQuery($username: String!) {
    user {
      searchByUsername(username: $username) {
        result {
          id
          username
          displayName
          labels
        }
      }
    }
  }
`)

interface SelectUserDrawerContentProps {
  onClose: () => void
  roleId: string
  onSave: () => void
  boundUserIds: string[]
}

const SelectUserDrawerContent: React.FC<SelectUserDrawerContentProps> = (
  props,
) => {
  const [qlArgs, setQlArgs] = useState({
    username: '',
  })
  const taskId = useRef<undefined | number>(undefined)
  const { result, isLoading } = useGraphQL(ListUserWithUsernameQuery, qlArgs)
  const [isSubmitting, setSubmitting] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set())

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (taskId.current) {
      clearTimeout(taskId.current)
    }
    taskId.current = setTimeout(() => {
      setQlArgs({
        username: e.target.value,
      })
    }, 400)
  }
  const onSave = async () => {
    setSubmitting(true)
    try {
      if (selectedKeys === 'all') {
        await bindRoleToUser({
          roleIds: [props.roleId],
          userIds: result!.user.searchByUsername.result.map((usr) => usr.id),
        })
      } else if (selectedKeys.size == 0) {
        addToast({
          title: '请选择用户',
          color: 'danger',
        })
      } else {
        const ids: string[] = []
        for (const selectedKey of selectedKeys) {
          ids.push(selectedKey as string)
        }
        await bindRoleToUser({
          roleIds: [props.roleId],
          userIds: ids,
        })
      }
      addToast({
        title: '绑定成功',
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
      <DrawerHeader>绑定用户</DrawerHeader>
      <DrawerBody>
        <Input
          size="sm"
          labelPlacement="outside"
          label="搜索"
          onChange={onChange}
          placeholder="搜索权限"
          startContent={<SvgIcon icon={Icon.SEARCH} />}
        />
        <Table
          onSelectionChange={setSelectedKeys}
          removeWrapper
          aria-label="User List"
          selectionMode="multiple"
          color="primary"
          disabledKeys={props.boundUserIds}
        >
          <TableHeader>
            <TableColumn>用户名</TableColumn>
            <TableColumn>昵称</TableColumn>
            <TableColumn>标签</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<TableLoadingMask />}
            items={result?.user.searchByUsername.result ?? []}
            emptyContent={'没有匹配的用户'}
          >
            {(user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <LabelsDisplay attributes={user.labels} />
                </TableCell>
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
          保存
        </Button>
      </DrawerFooter>
    </>
  )
}

export default SelectUserDrawerContent
