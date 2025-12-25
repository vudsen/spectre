import { createBrowserRouter } from 'react-router'
import Layout from '@/pages/layout.tsx'
import i18n from '@/i18n'

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
            return { Component: Home, handle: { crumb: i18n.t('router.home') } }
          },
        },
        {
          path: 'runtime-node',
          handle: { crumb: i18n.t('router.runtimeNode') },
          children: [
            {
              path: 'list',
              lazy: async () => {
                const { default: Home } = await import(
                  '@/pages/runtime-node/list'
                )
                return {
                  Component: Home,
                  handle: { crumb: i18n.t('router.nodeList') },
                }
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
                    return {
                      Component: Home,
                      handle: { crumb: i18n.t('router.newRuntimeNode') },
                    }
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
              handle: {
                crumb: i18n.t('router.nodeList'),
                crumbHref: '/runtime-node/list',
              },
              children: [
                {
                  path: 'tree',
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/[node-id]/tree'
                    )
                    return {
                      Component: Home,
                      handle: { crumb: i18n.t('router.nodeTree') },
                    }
                  },
                },
                {
                  path: 'attach',
                  lazy: async () => {
                    const { default: Home } = await import(
                      '@/pages/runtime-node/[node-id]/attach'
                    )
                    return {
                      Component: Home,
                      handle: { crumb: i18n.t('router.connect') },
                    }
                  },
                },
                {
                  path: 'view',
                  lazy: async () => {
                    const { default: View } = await import(
                      '@/pages/runtime-node/[node-id]/view'
                    )
                    return {
                      Component: View,
                      handle: { crumb: i18n.t('router.nodeDetail') },
                    }
                  },
                },
              ],
            },
          ],
        },
        {
          path: 'toolchain',
          handle: { crumb: i18n.t('router.toolchain') },
          children: [
            {
              path: 'items',
              lazy: async () => {
                const { default: Home } = await import(
                  '@/pages/toolchain/items'
                )
                return {
                  Component: Home,
                  handle: { crumb: i18n.t('router.toolchainItem') },
                }
              },
            },
            {
              path: 'bundles',
              lazy: async () => {
                const { default: ToolchainBundlePage } = await import(
                  '@/pages/toolchain/bundles'
                )
                return {
                  Component: ToolchainBundlePage,
                  handle: { crumb: i18n.t('router.toolchainBundle') },
                }
              },
            },
          ],
        },
        {
          path: 'permission',
          handle: {
            crumb: i18n.t('router.permission'),
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
                  handle: { crumb: i18n.t('router.permission') },
                }
              },
            },
            {
              path: 'user',
              handle: {
                crumb: i18n.t('router.user'),
              },
              lazy: async () => {
                const { default: UserPage } = await import(
                  '@/pages/permission/user'
                )
                return {
                  Component: UserPage,
                }
              },
            },
            {
              path: 'role/:roleId',
              lazy: async () => {
                const { default: RolePermissionDetailPage } = await import(
                  '@/pages/permission/role/[roleId]'
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
              path: 'user/:userId',
              lazy: async () => {
                const { default: UserDetailPage } = await import(
                  '@/pages/permission/user/[userId]'
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
            crumb: i18n.t('router.audit'),
          },
          lazy: async () => {
            const { default: AuditPage } = await import('@/pages/audit')
            return {
              Component: AuditPage,
            }
          },
        },
        {
          path: '/settings',
          handle: {
            crumb: i18n.t('router.settings'),
          },
          lazy: async () => {
            const { default: SettingsPage } = await import('@/pages/settings')
            return { Component: SettingsPage }
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
    {
      path: 'channel',
      handle: {
        crumb: i18n.t('router.connect'),
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
  ],
  {
    basename: import.meta.env.VITE_BASE_PATH ?? '/',
  },
)

export default router
