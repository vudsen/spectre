import { graphql } from '@/graphql/generated'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { type DocumentResult, execute } from '@/graphql/execute.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import useCrumb, { type Crumb } from '@/hook/useCrumb.ts'
import { Button, Card, CardBody } from '@heroui/react'
import DetailGrid from '@/components/DetailGrid.tsx'
import { formatTime } from '@/common/util.ts'
import SpectreTabs, { type TabContent } from '@/components/SpectreTabs'
import UserRoleList from './UserRoleList.tsx'
import LabelList from './LabelList.tsx'
import { useNavigate, useParams } from 'react-router'
import i18n from '@/i18n'

const UserDetailQuery = graphql(`
  query UserDetailQuery($userId: Long!) {
    user {
      user(id: $userId) {
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
  const params = useParams() as {
    userId: string
  }

  const nav = useNavigate()

  useEffect(() => {
    execute(UserDetailQuery, params)
      .then((r) => {
        const user = r.user.user
        if (user) {
          setUser(user)
        }
      })
      .finally(() => setLoading(false))
  }, [params])

  const crumbs: Crumb[] = useMemo(() => {
    return [
      {
        name: i18n.t('hardcoded.msg_pages_permission_role_param_index_002'),
        href: '/permission/user',
      },
      {
        name: user
          ? (user.displayName ?? user.username)
          : i18n.t('hardcoded.msg_pages_permission_role_param_index_001'),
      },
    ]
  }, [user])
  useCrumb(crumbs)

  const tabs: TabContent[] = useMemo(() => {
    return [
      {
        name: i18n.t('hardcoded.msg_pages_permission_role_index_001'),
        key: 'User',
        content: <UserRoleList uid={params.userId} />,
      },
      {
        name: i18n.t('hardcoded.msg_components_labeleditor_index_001'),
        key: 'Labels',
        content: <LabelList labels={user?.labels} />,
      },
    ]
  }, [params, user?.labels])

  const updateUser = useCallback(() => {
    nav(`/permission/user/modify?uid=${params.userId}`)
  }, [nav, params])

  if (isLoading) {
    return (
      <div>
        <TableLoadingMask />
      </div>
    )
  }
  if (!user) {
    return (
      <div>{i18n.t('hardcoded.msg_pages_permission_role_param_index_003')}</div>
    )
  }
  return (
    <div className="mx-6 space-y-3">
      <div className="spectre-heading">{user.displayName ?? user.username}</div>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="header-2 mb-3">
              {i18n.t('hardcoded.msg_ext_view_k8sview_001')}
            </div>
            <Button color="primary" variant="flat" onPress={updateUser}>
              {i18n.t('hardcoded.msg_pages_permission_user_modify_index_001')}
            </Button>
          </div>
          <DetailGrid
            details={[
              {
                name: i18n.t('common.username'),
                value: user.username,
              },
              {
                name: i18n.t(
                  'hardcoded.msg_pages_permission_role_param_roleuserlist_004',
                ),
                value: user.displayName ?? '-',
              },
              {
                name: i18n.t(
                  'hardcoded.msg_components_page_permissionslist_index_010',
                ),
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
