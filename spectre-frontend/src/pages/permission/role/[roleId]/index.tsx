import { graphql } from '@/graphql/generated'
import React, { useEffect, useMemo, useState } from 'react'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import {
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerContent,
  useDisclosure,
} from '@heroui/react'
import { formatTime } from '@/common/util.ts'
import useCrumb, { type Crumb } from '@/hook/useCrumb.ts'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import RoleUserList from './RoleUserList.tsx'
import StaticPermissionList from '@/components/page/StaticPermissionList'
import PolicyPermissionList from '@/components/page/PolicyPermissionList'
import RoleModifyDrawerContent from '@/pages/permission/role/RoleModifyDrawerContent.tsx'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import type { RoleModifyVO } from '@/api/impl/role.ts'
import { useParams } from 'react-router'

const RolePermissionDetailQuery = graphql(`
  query RolePermissionDetailQuery($roleId: Long!) {
    role {
      role(id: $roleId) {
        id
        name
        createdAt
        description
      }
    }
  }
`)

type UserRoleData = DocumentResult<
  typeof RolePermissionDetailQuery
>['role']['role']
const RolePermissionDetailPage: React.FC = () => {
  const params = useParams() as {
    roleId: string
  }

  const roleModifyDrawerClosure = useDisclosure()
  const [role, setRole] = useState<UserRoleData | null>(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    execute(RolePermissionDetailQuery, params)
      .then((r) => {
        const result = r.role.role
        if (result) {
          setRole(result)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params])

  const crumbs: Crumb[] = useMemo(() => {
    return [
      {
        name: '角色',
        href: '/permission/role',
      },
      {
        name: role ? role.name : '详情',
      },
    ]
  }, [role])
  useCrumb(crumbs)

  const tabs: TabContent[] = useMemo(() => {
    return [
      {
        name: '用户',
        key: 'User',
        content: <RoleUserList roleId={params.roleId} />,
      },
      {
        name: '静态权限',
        key: 'StaticPermission',
        content: (
          <StaticPermissionList subjectId={params.roleId} subjectType="ROLE" />
        ),
      },
      {
        name: '策略权限',
        key: 'PolicyPermission',
        content: (
          <PolicyPermissionList subjectId={params.roleId} subjectType="ROLE" />
        ),
      },
    ]
  }, [params.roleId])

  const onSave = (newRole: RoleModifyVO) => {
    setRole((prev) => {
      if (!prev) {
        throw new Error('Unreachable code.')
      }
      return {
        ...prev,
        ...newRole,
      }
    })
  }

  if (isLoading) {
    return (
      <div>
        <TableLoadingMask />
      </div>
    )
  }
  if (!role) {
    return <div>角色不存在</div>
  }
  return (
    <div className="px-6">
      <div className="spectre-heading">{role.name}</div>
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <div className="header-2">详细信息</div>
            <Button
              color="primary"
              variant="flat"
              onPress={roleModifyDrawerClosure.onOpen}
            >
              编辑
            </Button>
          </div>
          <div className="grid grid-cols-3 text-sm">
            <div>
              <div className="font-bold">角色名称</div>
              <div>{role.name}</div>
            </div>
            <div className="border-x-divider border-x-1 px-3">
              <div className="font-bold">创建时间</div>
              <div>{formatTime(role.createdAt)}</div>
            </div>
            <div className="px-3">
              <div className="font-bold">描述</div>
              <div>{role.description}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <SpectreTabs className="pt-10" tabs={tabs} />
      <Drawer
        isOpen={roleModifyDrawerClosure.isOpen}
        onOpenChange={roleModifyDrawerClosure.onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <RoleModifyDrawerContent
              oldEntity={role}
              onClose={onClose}
              onSave={onSave}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default RolePermissionDetailPage
