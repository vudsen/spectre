import Header from '@/pages/channel/[channelId]/Header.tsx'
import Toolbar from '@/pages/channel/[channelId]/Toolbar.tsx'
import TabsController, {
  type TabsControllerRef,
} from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import ChannelSvgSymbols from '@/pages/channel/[channelId]/_channel_icons/svg-symbols.tsx'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ChannelContext, {
  type ChannelContextState,
} from '@/pages/channel/[channelId]/context.ts'
import type { QuickCommandRef } from '@/pages/channel/[channelId]/_component/QuickCommand'
import useArthasMessageBus from '@/pages/channel/[channelId]/useArthasMessageBus.tsx'
import AiPanel from '@/pages/channel/[channelId]/_ai/AiPanel.tsx'
import './_message_view/init.ts'
import type { InstanceInfoVO } from '@/api/impl/arthas.ts'
import { store } from '@/store'
import { showDialog } from '@/common/util.ts'
import { useDispatch } from 'react-redux'
import { setTipRead } from '@/store/tipSlice.ts'
import i18n from '@/i18n'

interface ChannelLayoutProps {
  channelInfos: InstanceInfoVO[]
  channelId: string
}

const ChannelLayout: React.FC<ChannelLayoutProps> = (props) => {
  const bus = useArthasMessageBus(props.channelId, props.channelInfos)
  const tabsController = useRef<TabsControllerRef>(null)
  const quickCommandRef = useRef<QuickCommandRef>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!store.getState().tip.batchInstanceIncompleteTip) {
      showDialog({
        title: i18n.t('channel.incompleteTipTitle'),
        message: i18n.t('channel.incompleteTipMessage'),
        color: 'primary',
        confirmBtnText: i18n.t('common.gotIt'),
        onConfirm() {
          dispatch(
            setTipRead({
              batchInstanceIncompleteTip: true,
            }),
          )
        },
      })
    }
  }, [dispatch])

  const contextValue = useMemo<ChannelContextState | null>(() => {
    if (!bus) {
      return null
    }
    return {
      messageBus: bus,
      getTabsController() {
        return tabsController.current!
      },
      getQuickCommandExecutor() {
        return quickCommandRef.current!
      },
    }
  }, [bus])

  if (!contextValue) {
    return
  }
  return (
    <>
      <ChannelSvgSymbols />
      <ChannelContext value={contextValue}>
        <div className="flex">
          <div className="w-0 grow">
            <Header
              channelId={props.channelId}
              appName={
                props.channelInfos.length > 1
                  ? props.channelInfos.map((info) => info.jvmName).join(';')
                  : props.channelInfos[0].jvmName
              }
              aiConsoleOpen={aiOpen}
              onAiConsoleToggle={() => {
                setAiOpen((old) => !old)
              }}
              ref={quickCommandRef}
            />
            <div className="flex">
              <div className="flex min-w-0 grow">
                <Toolbar />
                <TabsController ref={tabsController} />
              </div>
            </div>
          </div>
          <AiPanel
            channelId={props.channelId}
            isOpen={aiOpen}
            onClose={() => setAiOpen(false)}
          />
        </div>
      </ChannelContext>
    </>
  )
}

export default ChannelLayout
