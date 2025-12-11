import { graphql } from '@/graphql/generated'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import useCrumb, { type Crumb } from '@/hook/useCrumb.ts'
import { Button, Card, CardBody } from '@heroui/react'
import DetailGrid from '@/components/DetailGrid.tsx'
import { formatTime } from '@/common/util.ts'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import UserRoleList from '@/pages/permission/user/detail/UserRoleList.tsx'
import LabelList from '@/pages/permission/user/detail/LabelList.tsx'
import { useNavigate } from 'react-router'

const UserDetailQuery = graphql(`
  query UserDetailQuery($id: Long!) {
    user {
      user(id: $id) {
        id
        createdAt
        displayName
        username
        labels
      }
    }
  }
`)

type UserData = DocumentResult<typeof UserDetailQuery>['user']['user']

const UserDetail: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setLoading] = useState(true)
  const uid = useMemo(() => {
    return new URLSearchParams(location.search).get('uid') ?? '-1'
  }, [])
  const nav = useNavigate()

  useEffect(() => {
    execute(UserDetailQuery, { id: uid })
      .then((r) => {
        const user = r.user.user
        if (user) {
          setUser(user)
        }
      })
      .finally(() => setLoading(false))
  }, [uid])

  const crumbs: Crumb[] = useMemo(() => {
    return [
      {
        name: '用户',
        href: '/permission/user',
      },
      {
        name: user ? (user.displayName ?? user.username) : '详情',
      },
    ]
  }, [user])
  useCrumb(crumbs)

  const tabs: TabContent[] = useMemo(() => {
    return [
      {
        name: '角色',
        key: 'User',
        content: <UserRoleList uid={uid} />,
      },
      {
        name: '标签',
        key: 'Labels',
        content: <LabelList labels={user?.labels} />,
      },
    ]
  }, [uid, user?.labels])

  const updateUser = useCallback(() => {
    nav(`/permission/user/modify?uid=${uid}`)
  }, [nav, uid])

  if (isLoading) {
    return (
      <div>
        <TableLoadingMask />
      </div>
    )
  }
  if (!user) {
    return <div>角色不存在</div>
  }
  return (
    <div className="mx-6 space-y-3">
      <div className="spectre-heading">{user.displayName ?? user.username}</div>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="header-2 mb-3">基础信息</div>
            <Button color="primary" variant="flat" onPress={updateUser}>
              更新用户
            </Button>
          </div>
          <DetailGrid
            details={[
              {
                name: '用户名',
                value: user.username,
              },
              {
                name: '昵称',
                value: user.displayName ?? '-',
              },
              {
                name: '创建时间',
                value: formatTime(user.createdAt),
              },
            ]}
          />
        </CardBody>
      </Card>
      <SpectreTabs className="pt-10" tabs={tabs} />
    </div>
  )
}

export default UserDetail
