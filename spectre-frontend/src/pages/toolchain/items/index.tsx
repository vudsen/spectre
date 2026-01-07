import React, { useEffect, useState } from 'react'
import { Tab, Tabs } from '@heroui/react'
import toolchainTypes from './ToolchainItemType.ts'
import ToolChainItems from './ToolChainItems.tsx'
import 'shepherd.js/dist/css/shepherd.css'
import Shepherd from 'shepherd.js'
import {
  appendShepherdStepsBeforeShow,
  shepherdOffset,
  showDialog,
} from '@/common/util.ts'
import {
  ToolchainItemsContext,
  type ToolchainItemsContextType,
} from '@/pages/toolchain/items/context.ts'
import { updateTourStep } from '@/api/impl/sys-conf.ts'

const tabs = toolchainTypes.map((it) => ({
  name: it.name,
  key: it.type,
  content: <ToolChainItems type={it} />,
}))

const ToolChainPage: React.FC = () => {
  const [visited, setVisited] = useState<Set<string>>(new Set(['ARTHAS']))
  const [context, setContext] = useState<ToolchainItemsContextType>({})
  const onSelectionChange = (k: string | number) => {
    if (typeof k === 'string') {
      setVisited((prev) => new Set(prev).add(k))
    }
  }

  useEffect(() => {
    const sp = new URL(location.href).searchParams
    const guide = sp.get('guide') === 'true'
    if (guide) {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          canClickTarget: false,
          floatingUIOptions: {
            middleware: [shepherdOffset(0, 20)],
          },
        },
      })
      tour.options.defaultStepOptions!.beforeShowPromise =
        appendShepherdStepsBeforeShow(tour)
      setContext({
        tour,
      })
      tour.addStep({
        id: 'tc-types',
        title: '工具类型',
        text: `<div>Spectre 需要使用三种工具来和 Arthas 集成：
        <ul class="list-disc ml-5">
        <li>Arthas: 核心工具</li>
        <li>jattach: 用于加载 arthas-agent 到 JVM 中</li>
        <li>HttpClient: 一个简单的 Http CLI 工具，用于和 Arthas 交互</li>
        </ul>
          </div>`,
        attachTo: {
          element: '#toolchain-tab',
          on: 'bottom-start',
        },
        buttons: [
          {
            text: '下一步',
            action: tour.next,
          },
        ],
      })
      tour.addStep({
        id: 'builtin-data',
        title: '内置数据',
        text: '<div><div>我们已经内置了一些数据以便于快速使用。</div><div>你可能需要在稍后更新一下各个工具的版本，没有具体版本要求，但肯定是越新越好。</div></div>',
        attachTo: {
          element: '#ARTHAS',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Next',
            action: tour.next,
          },
        ],
      })
      tour.addStep({
        id: 'view-toolchain',
        title: '查看详情',
        text: '点击此处查看详情',
        canClickTarget: true,
        attachTo: {
          element: '#view-arthas',
          on: 'left',
        },
        floatingUIOptions: {
          middleware: [shepherdOffset(-20, -20)],
        },
      })
      tour.addStep({
        id: 'details',
        title: '手动上传',
        text: '<div><div>如果你在较差的网络环境/离线环境下，可以手动上传工具包，点击 `false` 即可手动上传。</div><div>当然，Spectre 也会在使用到时自动下载并缓存。</div></div>',
        attachTo: {
          element: '#cache-status',
          on: 'bottom',
        },
        buttons: [
          {
            text: '完成教程',
            action: tour.complete,
          },
        ],
      })

      showDialog({
        title: '欢迎使用 Spectre',
        message: '在该界面中，我们将介绍工具包的使用。',
        cancelBtnText: '跳过',
        confirmBtnText: '开始',
        hideCancel: true,
        color: 'primary',
        isDismissable: false,
        onConfirm() {
          tour.start()
        },
      })
      const completeEvt = () => {
        updateTourStep(0).then()
      }
      tour.on('complete', completeEvt)
      return () => {
        tour.off('complete', completeEvt)
      }
    }
  }, [])

  return (
    <ToolchainItemsContext value={context}>
      <div className="px-6">
        <div className="mb-3 text-xl font-semibold">工具设置</div>
        <Tabs
          aria-label="Toolchain"
          color="primary"
          destroyInactiveTabPanel={false}
          onSelectionChange={onSelectionChange}
          id="toolchain-tab"
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
    </ToolchainItemsContext>
  )
}

export default ToolChainPage
