import type React from 'react'
import { lazy } from 'react'
import type { FormPage, ViewComponent } from '@/ext/type.ts'

const modules = import.meta.glob('./**/*.tsx') as Record<
  string,
  () => Promise<{ default: React.ComponentType<unknown> }>
>

const pages = Object.fromEntries(
  Object.entries(modules).map(([path, importer]) => {
    return [path.substring(2, path.length - 4), lazy(importer)]
  }),
)

const ExtensionPageManager = {
  getFormPage(pageName: string): React.LazyExoticComponent<FormPage> {
    if (!pageName.startsWith('form/')) {
      throw new Error('Page name must start with `form/`')
    }
    return pages[pageName] as React.LazyExoticComponent<FormPage>
  },
  getViewComponent(pageName: string): React.LazyExoticComponent<ViewComponent> {
    if (!pageName.startsWith('view/')) {
      throw new Error('Page name must start with `view/`')
    }
    return pages[pageName] as React.LazyExoticComponent<ViewComponent>
  },
}

export default ExtensionPageManager
