import { createBrowserRouter } from 'react-router'
import Layout from '@/pages/layout.tsx'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          lazy: async () => {
            const { default: Home } = await import('@/pages/home')
            return { Component: Home, handle: { crumb: '首页' } }
          },
        },
        {
          path: 'runtime-node',
          handle: { crumb: '运行节点' },
          children: [
            {
              path: 'list',
              lazy: async () => {
                const { default: Home } = await import(
                  '@/pages/runtime-node/list'
                )
                return { Component: Home, handle: { crumb: '节点列表' } }
              },
            },
            {
              path: 'modify',
              children: [
                {
                  index: true,
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/modify'
                    )
                    return { Component: Home, handle: { crumb: '新建节点' } }
                  },
                },
                {
                  path: ':pluginId',
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/modify/[pluginId]'
                    )
                    return { Component: Home }
                  },
                },
              ],
            },
            {
              path: ':node-id',
              handle: { crumb: '节点列表', crumbHref: '/runtime-node/list' },
              children: [
                {
                  path: 'tree',
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/[node-id]/tree'
                    )
                    return { Component: Home, handle: { crumb: '节点树' } }
                  },
                },
                {
                  path: 'attach',
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/[node-id]/attach'
                    )
                    return { Component: Home, handle: { crumb: '连接' } }
                  },
                },
                {
                  path: 'view',
                  lazy: async () => {
                    const { default: View } = await import(
                      '@/pages/runtime-node/[node-id]/view'
                    )
                    return { Component: View, handle: { crumb: '节点详情' } }
                  },
                },
              ],
            },
          ],
        },
        {
          path: 'settings',
          handle: { crumb: '设置' },
          children: [
            {
              path: 'toolchain',
              lazy: async () => {
                const { default: Home } = await import(
                  '@/pages/settings/toolchain'
                )
                return { Component: Home, handle: { crumb: '工具' } }
              },
            },
            {
              path: 'toolchain-bundle',
              lazy: async () => {
                const { default: ToolchainBundlePage } = await import(
                  '@/pages/settings/toolchain-bundle'
                )
                return {
                  Component: ToolchainBundlePage,
                  handle: { crumb: '工具包' },
                }
              },
            },
          ],
        },
        {
          path: 'channel',
          handle: {
            crumb: '连接',
          },
          children: [
            {
              path: ':channelId',
              lazy: async () => {
                const { default: Home } = await import(
                  '@/pages/channel/[channelId]'
                )
                return { Component: Home, handle: { hideCrumb: true } }
              },
            },
          ],
        },
        {
          path: 'permission',
          handle: {
            crumb: '权限',
          },
          children: [
            {
              path: 'role',
              lazy: async () => {
                const { default: RolePage } = await import(
                  '@/pages/permission/role'
                )
                return {
                  Component: RolePage,
                  handle: { crumb: '角色' },
                }
              },
            },
            {
              path: 'user',
              handle: {
                crumb: '用户',
              },
              lazy: async () => {
                const { default: UserPage } = await import(
                  '@/pages/permission/user'
                )
                return { Component: UserPage, handle: { crumb: '用户' } }
              },
            },
            {
              path: 'role/detail',
              lazy: async () => {
                const { default: RolePermissionDetailPage } = await import(
                  '@/pages/permission/role/detail'
                )
                return {
                  Component: RolePermissionDetailPage,
                }
              },
            },
            {
              path: 'user/modify',
              lazy: async () => {
                const { default: UserModifyPage } = await import(
                  '@/pages/permission/user/modify'
                )
                return {
                  Component: UserModifyPage,
                }
              },
            },
            {
              path: 'user/detail',
              lazy: async () => {
                const { default: UserDetailPage } = await import(
                  '@/pages/permission/user/detail'
                )
                return {
                  Component: UserDetailPage,
                }
              },
            },
          ],
        },
        {
          path: 'audit',
          handle: {
            crumb: '审计',
          },
          lazy: async () => {
            const { default: AuditPage } = await import('@/pages/audit')
            return {
              Component: AuditPage,
            }
          },
        },
      ],
    },
    {
      path: '/login',
      lazy: async () => {
        const { default: LoginPage } = await import('@/pages/login')
        return { Component: LoginPage }
      },
    },
  ],
  {
    basename: import.meta.env.VITE_BASE_PATH ?? '/',
  },
)

export default router
