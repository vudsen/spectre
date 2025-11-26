import React, { useCallback, useState } from 'react'
import { Tab, Tabs } from '@heroui/react'
import classnames from '@/components/SpectreTabs/styles.ts'

export type TabContent = {
  name: string
  key: string
  content: React.ReactNode
}

interface SpectreTabsProps {
  tabs: TabContent[]
  className?: string
  defaultActiveTabKey?: string
}

/**
 * 用于统一风格的 tabs. 提供了持久化的支持，每次打开页面都只会渲染一次，并且会复用前一次的渲染。
 * @constructor
 */
const SpectreTabs: React.FC<SpectreTabsProps> = (props) => {
  const [visited, setVisited] = useState<Set<string>>(
    new Set([
      props.defaultActiveTabKey ? props.defaultActiveTabKey : props.tabs[0].key,
    ]),
  )

  const onSelectionChange = useCallback((k: string | number) => {
    if (typeof k === 'string') {
      setVisited((prev) => new Set(prev).add(k))
    }
  }, [])
  return (
    <Tabs
      className={props.className}
      aria-label="Toolchain"
      color="primary"
      destroyInactiveTabPanel={false}
      onSelectionChange={onSelectionChange}
      classNames={classnames}
      variant="underlined"
    >
      {' '}
      {props.tabs.map((it) => (
        <Tab key={it.key} title={it.name}>
          {visited.has(it.key) ? it.content : null}
        </Tab>
      ))}
    </Tabs>
  )
}
export default SpectreTabs
