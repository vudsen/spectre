import { graphql } from '@/graphql/generated'
import React, { useMemo } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { Button, Card, CardBody } from '@heroui/react'
import { formatTime } from '@/common/util.ts'
import useCrumb, { type Crumb } from '@/hook/useCrumb.ts'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import RoleUserList from '@/pages/permission/role/detail/RoleUserList.tsx'
import StaticPermissionList from '@/components/page/StaticPermissionList'
import PolicyPermissionList from '@/components/page/PolicyPermissionList'

const RolePermissionDetailQuery = graphql(`
  query RolePermissionDetailQuery($roleId: Long!) {
    role {
      role(id: $roleId) {
        name
        createdAt
        description
      }
    }
  }
`)

const RolePermissionDetailPage: React.FC = () => {
  const param = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return {
      roleId: searchParams.get('subjectId') ?? '-1',
    }
  }, [])

  const { result, isLoading } = useGraphQL(RolePermissionDetailQuery, param)

  const role = result?.role.role
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
        content: <RoleUserList />,
      },
      {
        name: '静态权限',
        key: 'StaticPermission',
        content: (
          <StaticPermissionList subjectId={param.roleId} subjectType="ROLE" />
        ),
      },
      {
        name: '策略权限',
        key: 'PolicyPermission',
        content: (
          <PolicyPermissionList subjectId={param.roleId} subjectType="ROLE" />
        ),
      },
    ]
  }, [param.roleId])

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
          <div className="flex items-center justify-between">
            <div className="spectre-heading">详细信息</div>
            <Button color="primary" variant="bordered" size="sm">
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
    </div>
  )
}

export default RolePermissionDetailPage
