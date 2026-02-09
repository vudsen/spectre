import {
  Button,
  Code,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import React, { useCallback, useEffect, useState } from 'react'
import {
  listStaticPermissionNames,
  type PermissionResourceDTO,
} from '@/api/impl/permission.ts'
import clsx from 'clsx'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { graphql } from '@/graphql/generated'
import { execute } from '@/graphql/execute.ts'

const PermissionsBindQuery = graphql(`
  query PermissionsBindQuery($resource: String) {
    permission {
      listPermissionsByResource(resource: $resource) {
        action
        name
      }
    }
  }
`)

interface BindAclPermissionDrawerContentProps {
  onClose: () => void
  subjectId: string
  subjectType: string
  onRequireBind: (entity: ACLPermissionEntityWithState) => void
}

export type ACLPermissionEntityWithState = {
  resource: string
  action: string
  name: string
  code: string
}

const PermissionsDrawerContent: React.FC<
  BindAclPermissionDrawerContentProps
> = (props) => {
  const [resources, setResources] = useState<PermissionResourceDTO[]>([])

  const [selectedResource, setSelectedResource] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<
    ACLPermissionEntityWithState[]
  >([])

  const loadPermissions = useCallback(
    (resource: string) => {
      setLoading(true)
      execute(PermissionsBindQuery, {
        subjectId: props.subjectId,
        subjectType: props.subjectType,
        resource,
      })
        .then((r) => {
          const p: ACLPermissionEntityWithState[] = []
          for (const permissions of r.permission.listPermissionsByResource) {
            const code = `${resource}:${permissions.action}`
            p.push({
              ...permissions,
              code,
              resource,
            })
          }
          setPermissions(p)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [props.subjectId, props.subjectType],
  )

  useEffect(() => {
    listStaticPermissionNames().then((r) => {
      setResources(r)
      loadPermissions('all')
    })
  }, [loadPermissions])

  const onAction = (resource: string) => {
    setSelectedResource(resource)
    setLoading(true)
    loadPermissions(resource)
  }

  const onBind = (entity: ACLPermissionEntityWithState) => {
    props.onRequireBind(entity)
  }

  return (
    <>
      <DrawerHeader>绑定权限</DrawerHeader>
      <DrawerBody className="h-full">
        <div className="border-t-divider flex h-full overflow-hidden border-t-1 pt-2">
          <div className="border-r-divider text-small w-40 border-r-1">
            {resources.map((res) => (
              <div
                key={res.resource}
                onClick={() => onAction(res.resource)}
                className={clsx(
                  'hover:bg-default-100 mr-1 cursor-pointer border-l-2 p-3',
                  res.resource === selectedResource
                    ? 'text-primary border-l-primary bg-primary-100'
                    : 'border-l-white',
                )}
              >
                {res.name}
              </div>
            ))}
          </div>
          <Table removeWrapper className="mx-3" aria-label="Permissions Table">
            <TableHeader>
              <TableColumn>名称</TableColumn>
              <TableColumn>代码</TableColumn>
              <TableColumn>已绑定数量</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody
              items={permissions}
              isLoading={loading}
              loadingContent={<TableLoadingMask />}
            >
              {(item) => (
                <TableRow key={item.code}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Code>{item.code}</Code>
                  </TableCell>
                  <TableCell className="text-sm">0</TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      size="sm"
                      variant="light"
                      onPress={() => onBind(item)}
                    >
                      添加
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DrawerBody>
      <DrawerFooter className="border-divider border-t-1">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-sm">
            Tips: 点击预览可以查看当前的修改
          </div>
          <div>
            <Button color="danger" variant="light" onPress={props.onClose}>
              关闭
            </Button>
          </div>
        </div>
      </DrawerFooter>
    </>
  )
}

export default PermissionsDrawerContent
