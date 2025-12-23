import { BreadcrumbItem, Breadcrumbs } from '@heroui/react'
import { Outlet, type UIMatch, useMatches, useNavigate } from 'react-router'
import React, { useCallback } from 'react'
import type { RootState } from '@/store'
import { useSelector } from 'react-redux'
import Menu from '@/pages/Menu.tsx'

type RouteHandle = {
  crumb: string
  crumbHref?: string
  hideCrumb: boolean
}

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
  return (
    <div>
      <div className="flex">
        <Menu />
        <div className="box-border flex h-screen w-0 grow flex-col overflow-y-scroll">
          <NavBreadcrumbs />
          <div className="h-0 grow">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
