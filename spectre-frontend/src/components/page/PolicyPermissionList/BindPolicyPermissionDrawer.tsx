import {
  Alert,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import React, { useCallback, useEffect, useState } from 'react'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { listAllPolicyPermissions } from '@/api/impl/policy-permission.ts'
import ModifyPermissionDrawerContent, {
  type PermissionEntityWithState,
} from './ModifyPermissionDrawerContent.tsx'

interface BindPolicyPermissionDrawerProps {
  subjectId: string
  isOpen: boolean
  onOpenChange: () => void
  onModified: () => void
}

const BindPolicyPermissionDrawer: React.FC<BindPolicyPermissionDrawerProps> = (
  props,
) => {
  const [permissions, setPermissions] = useState<PermissionEntityWithState[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const { onOpen, isOpen, onOpenChange } = useDisclosure()
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionEntityWithState>()

  useEffect(() => {
    listAllPolicyPermissions()
      .then((r) => {
        setPermissions(
          r.map((permission) => ({
            ...permission,
            code: `${permission.resource}:${permission.action}`,
          })),
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const onAddPermission = useCallback(
    (permission: PermissionEntityWithState) => {
      setSelectedPermission(permission)
      onOpen()
    },
    [onOpen],
  )

  return (
    <>
      <Drawer
        size="5xl"
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader>绑定策略权限</DrawerHeader>
              <DrawerBody>
                <div>
                  <Alert color="primary" className="text-sm">
                    策略权限:
                    一般用于更细粒度的权限控制，例如可以通过表达式判断用户是否拥有标签`role=developer`来决定能否访问资源。目前仅支持部分资源，对于持有静态权限`all:all`的用户，将跳过策略权限的判断。
                  </Alert>
                </div>
                <Table removeWrapper aria-label="Policy Permissions">
                  <TableHeader>
                    <TableColumn>名称</TableColumn>
                    <TableColumn>资源名称</TableColumn>
                    <TableColumn>操作名称</TableColumn>
                    <TableColumn>操作</TableColumn>
                  </TableHeader>
                  <TableBody
                    isLoading={loading}
                    loadingContent={<TableLoadingMask />}
                    items={permissions}
                  >
                    {(permission) => (
                      <TableRow key={permission.code}>
                        <TableCell>{permission.name}</TableCell>
                        <TableCell>{permission.resource}</TableCell>
                        <TableCell>{permission.action}</TableCell>
                        <TableCell>
                          <Button
                            color="primary"
                            size="sm"
                            onPress={() => onAddPermission(permission)}
                          >
                            添加
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DrawerBody>
              <DrawerFooter className="border-divider border-t-1">
                <Button color="danger" variant="light" onPress={onClose}>
                  关闭
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
      <Drawer size="xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(onClose) => (
            <>
              <ModifyPermissionDrawerContent
                permissionName={selectedPermission!.name}
                onModified={props.onModified}
                subjectId={props.subjectId}
                onClose={onClose}
                permission={selectedPermission!}
              />
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default BindPolicyPermissionDrawer
