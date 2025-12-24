import React, { useCallback, useMemo } from 'react'
import UserDisplay from '@/pages/UserDisplay.tsx'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router'
import Icon, { type Icons } from '@/components/icon/icon'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import { Accordion, AccordionItem } from '@heroui/react'
import clsx from 'clsx'

type Navigation = {
  name: string
  to: string
}

type NavigationSubGroup = {
  name: string
  icon: Icons
  to?: string
  basePath: string
  items: Navigation[]
}

type NavigationGroup = {
  name: string
  icon?: Icons
  items: NavigationSubGroup[]
}

interface AccordionHeaderProps {
  name: string
  icon?: Icons
  size?: number
  isActive?: boolean
}

const AccordionHeader: React.FC<AccordionHeaderProps> = (props) => {
  return (
    <div
      className={clsx(
        'flex items-center',
        props.isActive ? 'text-primary' : undefined,
      )}
    >
      {props.icon ? <SvgIcon icon={props.icon} size={props.size} /> : null}
      <span className="ml-2">{props.name}</span>
    </div>
  )
}

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

const Menu: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const tryNav = useCallback(
    (path?: string) => {
      if (!path) {
        return
      }
      nav(path)
    },
    [nav],
  )

  const navigations: NavigationGroup[] = useMemo(() => {
    return [
      {
        name: t('router.runtimeNode'),
        items: [
          {
            name: t('router.nodeSettings'),
            basePath: '/runtime-node',
            icon: Icon.DATASOURCE,
            items: [
              {
                name: t('router.newRuntimeNode'),
                to: '/runtime-node/modify',
              },
              {
                name: t('router.nodeList'),
                to: '/runtime-node/list',
              },
            ],
          },
          {
            name: t('router.toolchain'),
            icon: Icon.WRENCH,
            basePath: '/toolchain',
            items: [
              {
                name: t('router.toolchainItem'),
                to: '/toolchain/items',
              },
              {
                name: t('router.toolchainBundle'),
                to: '/toolchain/bundles',
              },
            ],
          },
        ],
      },
      {
        name: t('router.infoMaintain'),
        items: [
          {
            name: t('router.userManagement'),
            icon: Icon.USER,
            basePath: '/permission',
            items: [
              {
                name: t('router.user'),
                to: '/permission/user',
              },
              {
                name: t('router.role'),
                to: '/permission/role',
              },
            ],
          },
        ],
      },
      {
        name: t('router.sysMaintain'),
        items: [
          {
            name: t('router.audit'),
            basePath: '/audit',
            icon: Icon.AUDIT,
            to: '/audit',
            items: [],
          },
          {
            name: t('router.settings'),
            basePath: '/settings',
            icon: Icon.SETTINGS,
            to: '/settings',
            items: [],
          },
        ],
      },
    ]
  }, [t])

  const locations = useLocation()
  const defaultExpandKeys = useMemo(() => {
    for (const navigation of navigations) {
      for (const item of navigation.items) {
        if (locations.pathname.startsWith(item.basePath)) {
          return [item.name]
        }
      }
    }
    return []
  }, [locations.pathname, navigations])
  return (
    <div className="h-screen min-w-48 overflow-y-scroll">
      <div className="z-40 box-border flex h-screen min-w-48 flex-col justify-between border-r-1 border-r-zinc-100 bg-zinc-50 px-2">
        <div className="space-y-2 pt-2 text-nowrap">
          <div className="text-primary my-3 flex grow-0 items-center text-2xl font-bold">
            <SvgIcon icon={Icon.LOGO} size={30} />
            <span className="ml-2">Spectre</span>
          </div>
          <NavLinkButton
            name={t('router.home')}
            to="/"
            size={22}
            icon={Icon.HOME}
          />
          {navigations.map((root) => (
            <React.Fragment key={root.name}>
              <div className="text-xs font-normal">{root.name}</div>
              <Accordion
                defaultExpandedKeys={defaultExpandKeys}
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
                      content: clsx(
                        'px-3',
                        sub.items.length === 0 ? 'hidden' : undefined,
                      ),
                      heading:
                        'spectre-nav-item hover:bg-default-100 cursor-pointer',
                      trigger: 'cursor-pointer',
                    }}
                    aria-label={sub.name}
                    title={
                      <AccordionHeader
                        icon={sub.icon}
                        isActive={defaultExpandKeys.includes(sub.name)}
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
  )
}

export default Menu
