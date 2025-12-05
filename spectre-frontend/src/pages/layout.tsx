import {
  Accordion,
  AccordionItem,
  BreadcrumbItem,
  Breadcrumbs,
} from '@heroui/react'
import {
  NavLink,
  Outlet,
  type UIMatch,
  useMatches,
  useNavigate,
} from 'react-router'
import React, { useCallback } from 'react'
import Icon, { type Icons } from '@/components/icon/icon.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import type { RootState } from '@/store'
import { useSelector } from 'react-redux'
import UserDisplay from '@/pages/UserDisplay.tsx'

interface NavLinkButtonProps {
  name: string
  to: string
  icon?: Icons
  size?: number
}

const NavLinkButton: React.FC<NavLinkButtonProps> = (props) => {
  return (
    <div>
      <NavLink to={props.to}>
        {({ isActive }) => (
          <span
            className={`spectre-nav-item flex w-full items-center active:scale-[0.98] ${isActive ? 'bg-primary-100' : 'hover:bg-default-100'} flex items-center`}
          >
            {props.icon ? (
              <SvgIcon
                icon={props.icon}
                size={props.size}
                className={isActive ? 'text-primary' : undefined}
              />
            ) : null}
            <span className="ml-2">{props.name}</span>
          </span>
        )}
      </NavLink>
    </div>
  )
}

interface AccordionHeaderProps {
  name: string
  icon?: Icons
  size?: number
}

const AccordionHeader: React.FC<AccordionHeaderProps> = (props) => {
  return (
    <div className="flex items-center">
      {props.icon ? <SvgIcon icon={props.icon} size={props.size} /> : null}
      <span className="ml-2">{props.name}</span>
    </div>
  )
}

type RouteHandle = {
  crumb: string
  crumbHref?: string
  hideCrumb: boolean
}

type Navigation = {
  name: string
  to: string
}

type NavigationSubGroup = {
  name: string
  icon: Icons
  to?: string
  items: Navigation[]
}

type NavigationGroup = {
  name: string
  icon?: Icons
  items: NavigationSubGroup[]
}

const navigations: NavigationGroup[] = [
  {
    name: '运行节点',
    items: [
      {
        name: '节点设置',
        icon: Icon.DATASOURCE,
        items: [
          {
            name: '新建运行节点',
            to: '/runtime-node/modify',
          },
          {
            name: '节点列表',
            to: '/runtime-node/list',
          },
        ],
      },
      {
        name: '工具链',
        icon: Icon.SETTINGS,
        items: [
          {
            name: '工具',
            to: '/settings/toolchain',
          },
          {
            name: '工具包',
            to: '/settings/toolchain-bundle',
          },
        ],
      },
    ],
  },
  {
    name: '信息维护',
    items: [
      {
        name: '用户管理',
        icon: Icon.USER,
        items: [
          {
            name: '用户',
            to: '/permission/user',
          },
          {
            name: '角色',
            to: '/permission/role',
          },
        ],
      },
    ],
  },
  {
    name: '系统维护',
    items: [
      {
        name: '审计',
        icon: Icon.AUDIT,
        to: '/audit',
        items: [],
      },
    ],
  },
]

const NavBreadcrumbs: React.FC = () => {
  const matches = useMatches() as UIMatch<unknown, RouteHandle>[]
  const additionalCrumbs = useSelector(
    (state: RootState) => state.navbar.crumbs,
  )
  const nav = useNavigate()
  const hideCrumb = matches[matches.length - 1].handle?.hideCrumb
  const crumbs = matches.filter((match) => match.handle?.crumb)

  const tryNav = useCallback(
    (href?: string, disabled: boolean = false) => {
      if (!href || disabled) {
        return
      }
      nav(href)
    },
    [nav],
  )

  if (hideCrumb) {
    return null
  }
  return (
    <Breadcrumbs className="h-navbar flex items-center truncate px-6">
      {crumbs.map((crumb, index) => (
        <BreadcrumbItem
          key={crumb.handle.crumb}
          onPress={() =>
            tryNav(crumb.handle.crumbHref ?? crumb.pathname, index === 0)
          }
        >
          {crumb.handle.crumb}
        </BreadcrumbItem>
      ))}
      {additionalCrumbs.map((crumb) => (
        <BreadcrumbItem key={crumb.name} onPress={() => tryNav(crumb.href)}>
          <div className="max-w-72 truncate">{crumb.name}</div>
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  )
}

const Layout: React.FC = () => {
  const nav = useNavigate()
  const tryNav = (path?: string) => {
    if (!path) {
      return
    }
    nav(path)
  }

  return (
    <div>
      <div className="flex">
        <div className="w-48">
          <div className="fixed top-0 z-40 box-border h-screen w-48 border-r-1 border-r-zinc-100 bg-zinc-50 px-2">
            <div className="space-y-2 pt-2">
              <div className="text-primary my-3 flex grow-0 items-center text-2xl font-bold">
                <SvgIcon icon={Icon.LOGO} size={30} />
                <span className="ml-2">Spectre</span>
              </div>
              <NavLinkButton name="首页" to="/" size={22} icon={Icon.HOME} />
              {navigations.map((root) => (
                <React.Fragment key={root.name}>
                  <div className="text-xs font-normal">{root.name}</div>
                  <Accordion
                    hideIndicator={root.items.length === 0}
                    showDivider={false}
                    selectionMode="multiple"
                    className="p-0"
                  >
                    {root.items.map((sub) => (
                      <AccordionItem
                        hideIndicator={sub.items.length === 0}
                        onPress={() => tryNav(sub.to)}
                        key={sub.name}
                        classNames={{
                          base: 'w-full',
                          content: 'px-3',
                          heading:
                            'spectre-nav-item hover:bg-default-100 cursor-pointer',
                          trigger: 'cursor-pointer',
                        }}
                        aria-label={sub.name}
                        title={
                          <AccordionHeader
                            icon={sub.icon}
                            size={22}
                            name={sub.name}
                          />
                        }
                      >
                        {sub.items.map((item) => (
                          <NavLinkButton
                            key={item.name}
                            name={item.name}
                            to={item.to}
                          />
                        ))}
                      </AccordionItem>
                    ))}
                  </Accordion>
                </React.Fragment>
              ))}
            </div>
            <UserDisplay />
          </div>
        </div>
        <div className="box-border flex min-h-screen w-0 grow flex-col">
          <NavBreadcrumbs />
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
