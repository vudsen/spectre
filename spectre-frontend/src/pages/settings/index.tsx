import React from 'react'
import {
  Card,
  CardBody,
  Link,
  Select,
  SelectItem,
  type SharedSelection,
} from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_CACHE_KEY } from '@/i18n'

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation()
  const onLocaleChange = (sel: SharedSelection) => {
    if (sel === 'all') {
      return
    }
    const v = sel.entries().next().value![0] as string
    localStorage.setItem(LANGUAGE_CACHE_KEY, v)
    i18n.changeLanguage(v).catch((e) => {
      console.error(e)
    })
  }

  return (
    <div className="spectre-container relative h-full">
      <div className="spectre-heading">{t('router.settings')}</div>
      <Card>
        <CardBody className="space-y-3">
          <div className="header-2">{t('settings.basic')}</div>
          <Select
            onSelectionChange={onLocaleChange}
            className="w-64"
            label={t('settings.locale')}
            labelPlacement="outside"
            defaultSelectedKeys={
              i18n.resolvedLanguage ? [i18n.resolvedLanguage] : undefined
            }
          >
            <SelectItem key="zh-CN">简体中文 (zh-CN)</SelectItem>
            <SelectItem key="en">English (en) (Incomplete)</SelectItem>
          </Select>
        </CardBody>
      </Card>
      <div className="text-default-400 absolute bottom-0 w-full text-center text-sm">
        <div>Spectre Project</div>
        <Link href="https://github.com/vudsen/spectre" isExternal size="sm">
          GitHub
        </Link>
        <div>{import.meta.env.VITE_APP_VERSION ?? '<Unknown Version>'}</div>
      </div>
    </div>
  )
}

export default Settings
