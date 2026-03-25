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
import i18n from '@/i18n'

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
        title: i18n.t('hardcoded.msg_pages_toolchain_items_index_001'),
        text: i18n.t('hardcoded.msg_pages_toolchain_items_index_002'),
        attachTo: {
          element: '#toolchain-tab',
          on: 'bottom-start',
        },
        buttons: [
          {
            text: i18n.t('common.next'),
            action: tour.next,
          },
        ],
      })
      tour.addStep({
        id: 'builtin-data',
        title: i18n.t('hardcoded.msg_pages_toolchain_items_index_003'),
        text: i18n.t('hardcoded.msg_pages_toolchain_items_index_004'),
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
        title: i18n.t('hardcoded.msg_pages_permission_role_index_005'),
        text: i18n.t('hardcoded.msg_pages_toolchain_items_index_005'),
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
        title: i18n.t('hardcoded.msg_pages_toolchain_items_index_006'),
        text: i18n.t('hardcoded.msg_pages_toolchain_items_index_007'),
        attachTo: {
          element: '#cache-status',
          on: 'bottom',
        },
        buttons: [
          {
            text: i18n.t('hardcoded.msg_pages_toolchain_items_index_008'),
            action: tour.complete,
          },
        ],
      })

      showDialog({
        title: i18n.t('hardcoded.msg_pages_home_index_001'),
        message: i18n.t('hardcoded.msg_pages_toolchain_items_index_009'),
        cancelBtnText: i18n.t('hardcoded.msg_pages_toolchain_items_index_010'),
        confirmBtnText: i18n.t(
          'hardcoded.msg_pages_runtime_node_list_index_008',
        ),
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
        <div className="mb-3 text-xl font-semibold">
          {i18n.t('hardcoded.msg_pages_toolchain_items_index_011')}
        </div>
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
