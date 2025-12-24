import React, { useState } from 'react'
import { Tab, Tabs } from '@heroui/react'
import toolchainTypes from './ToolchainItemType.ts'
import ToolChainItems from './ToolChainItems.tsx'

const tabs = toolchainTypes.map((it) => ({
  name: it.name,
  key: it.type,
  content: <ToolChainItems type={it} />,
}))

const ToolChainPage: React.FC = () => {
  const [visited, setVisited] = useState<Set<string>>(new Set(['ARTHAS']))

  const onSelectionChange = (k: string | number) => {
    if (typeof k === 'string') {
      setVisited((prev) => new Set(prev).add(k))
    }
  }

  return (
    <div className="px-6">
      <div className="mb-3 text-xl font-semibold">工具设置</div>
      <Tabs
        aria-label="Toolchain"
        color="primary"
        destroyInactiveTabPanel={false}
        onSelectionChange={onSelectionChange}
        classNames={{
          tabList:
            'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-primary',
          tab: 'max-w-fit px-0 h-12',
          base: 'w-full mb-3',
          tabContent: 'group-data-[selected=true]:text-primary text-base',
        }}
        variant="underlined"
      >
        {tabs.map((it) => (
          <Tab key={it.key} title={it.name}>
            {visited.has(it.key) ? it.content : null}
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export default ToolChainPage
