import {
  addToast,
  Button,
  Checkbox,
  Code,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from '@heroui/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  listStaticPermissionNames,
  type PermissionResourceDTO,
  saveStaticPermissions,
} from '@/api/impl/static-permission.ts'
import clsx from 'clsx'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { graphql } from '@/graphql/generated'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

const PermissionsBindQuery = graphql(`
  query PermissionsBindQuery(
    $subjectId: Long
    $subjectType: String
    $resource: String
  ) {
    staticPermission {
      allBoundPermissions(
        subjectId: $subjectId
        subjectType: $subjectType
        resource: $resource
      ) {
        action
      }
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
  onSave: () => void
}

type ACLPermissionEntityWithState = {
  resource: string
  action: string
  name: string
  code: string
}

type Result = DocumentResult<typeof PermissionsBindQuery>

function parseBoundPermissions(resource: string, r?: Result): Set<string> {
  if (!r) {
    return new Set<string>()
  }

  const result = new Set<string>()
  for (const permission of r.staticPermission.allBoundPermissions) {
    result.add(`${resource}:${permission.action}`)
  }
  return result
}

const BindAclPermissionDrawerContent: React.FC<
  BindAclPermissionDrawerContentProps
> = (props) => {
  const [resources, setResources] = useState<PermissionResourceDTO[]>([])

  const [selectedResource, setSelectedResource] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const selectionMap = useRef<Record<string, boolean>>({})
  const [permissions, setPermissions] = useState<
    ACLPermissionEntityWithState[]
  >([])
  const [modifications, setModifications] = useState<
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
          const bound = parseBoundPermissions(resource, r)
          for (const permissions of r.staticPermission
            .listPermissionsByResource) {
            const code = `${resource}:${permissions.action}`
            if (selectionMap.current[code] === undefined) {
              selectionMap.current[code] = bound.has(code)
            }
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

  const onSelect = useCallback((entity: ACLPermissionEntityWithState) => {
    selectionMap.current[entity.code] = !selectionMap.current[entity.code]

    setModifications((prev) => {
      const pos = prev.findIndex((mod) => mod.code === entity.code)
      if (pos < 0) {
        return prev.concat(entity)
      }
      return prev.toSpliced(pos, 1)
    })
  }, [])

  const removeModification = useCallback(
    (entity: ACLPermissionEntityWithState) => {
      selectionMap.current[entity.code] = !selectionMap.current[entity.code]
      setModifications((prev) => {
        const pos = prev.findIndex((mod) => mod.code === entity.code)
        if (pos >= 0) {
          return prev.toSpliced(pos, 1)
        }
        console.warn(`Entity not found, code: ${entity.code}`)
        return prev
      })
    },
    [],
  )

  const onSave = () => {
    setSubmitLoading(true)
    saveStaticPermissions(
      modifications.map((mod) => ({
        action: mod.action,
        resource: mod.resource,
        enabled: selectionMap.current[mod.code],
        subjectId: props.subjectId,
        subjectType: props.subjectType,
      })),
    )
      .then(() => {
        addToast({
          title: '保存成功',
          color: 'success',
        })
        props.onSave()
        props.onClose()
      })
      .finally(() => {
        setSubmitLoading(false)
      })
  }

  return (
    <>
      <DrawerHeader>绑定权限</DrawerHeader>
      <DrawerBody className="h-full">
        <Tabs
          color="primary"
          aria-label="Permissions Tab"
          variant="underlined"
          classNames={{
            tabList:
              'gap-6 w-full relative rounded-none p-0 border-b border-divider',
            tab: 'max-w-fit px-2 h-12',
            panel: 'grow p-0',
          }}
        >
          <Tab key="bind" title="绑定权限">
            <div className="flex h-full overflow-hidden">
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
              <Table
                removeWrapper
                className="mx-3"
                aria-label="Permissions Table"
              >
                <TableHeader>
                  <TableColumn>操作</TableColumn>
                  <TableColumn>名称</TableColumn>
                  <TableColumn>代码</TableColumn>
                </TableHeader>
                <TableBody
                  items={permissions}
                  isLoading={loading}
                  loadingContent={<TableLoadingMask />}
                >
                  {(item) => (
                    <TableRow key={item.code}>
                      <TableCell>
                        <Checkbox
                          onValueChange={() => onSelect(item)}
                          defaultSelected={selectionMap.current[item.code]}
                        />
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Code>{item.code}</Code>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tab>
          <Tab key="preview" title={`预览 (${modifications.length})`}>
            <Table removeWrapper aria-label="Preview Modifications">
              <TableHeader>
                <TableColumn>名称</TableColumn>
                <TableColumn>资源</TableColumn>
                <TableColumn>操作名称</TableColumn>
                <TableColumn>代码</TableColumn>
                <TableColumn>修改类型</TableColumn>
                <TableColumn align="end">操作</TableColumn>
              </TableHeader>
              <TableBody items={modifications}>
                {(modification) => (
                  <TableRow key={modification.code}>
                    <TableCell>{modification.name}</TableCell>
                    <TableCell>{modification.resource}</TableCell>
                    <TableCell>{modification.action}</TableCell>
                    <TableCell>
                      <Code>{modification.code}</Code>
                    </TableCell>
                    <TableCell>
                      {selectionMap.current[modification.code] ? (
                        <span className="text-success">新增</span>
                      ) : (
                        <span className="text-danger">移除</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => removeModification(modification)}
                      >
                        <SvgIcon icon={Icon.TRASH} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Tab>
        </Tabs>
      </DrawerBody>
      <DrawerFooter className="border-divider border-t-1">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-sm">
            Tips: 点击预览可以查看当前的修改
          </div>
          <div>
            <Button
              color="danger"
              variant="light"
              onPress={props.onClose}
              isDisabled={submitLoading}
            >
              关闭
            </Button>
            <Button color="primary" onPress={onSave} isLoading={submitLoading}>
              保存
            </Button>
          </div>
        </div>
      </DrawerFooter>
    </>
  )
}

export default BindAclPermissionDrawerContent
