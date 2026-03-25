import React, { useContext, useEffect, useState } from 'react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import { Button, Card, CardBody } from '@heroui/react'
import KVGird from '@/components/KVGird'
import KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import MemoryChart from '@/pages/channel/[channelId]/_tabs/_dashboard/MemoryChart.tsx'
import ThreadTable from '@/pages/channel/[channelId]/_tabs/_dashboard/ThreadTable.tsx'
import PercentageData from '@/pages/channel/[channelId]/_tabs/_dashboard/PercentageData.tsx'
import clsx from 'clsx'
import type { DashboardMessage } from '@/pages/channel/[channelId]/_message_view/_component/DashboardMessageDetail.tsx'
import type { CommandMessage } from '../../_message_view/_component/CommandMessageDetail'
import i18n from '@/i18n'

const DashBoardTab: React.FC = () => {
  const context = useContext(ChannelContext)
  const [state, setState] = useState<DashboardMessage>()
  const [isRestartDashboardLoading, setRestartDashboardLoading] =
    useState(false)
  const [stopped, setStopped] = useState(false)

  useEffect(() => {
    const id = context.messageBus.addListener({
      onMessage: function (msg) {
        const current = msg[msg.length - 1]
        if (
          current.value.type === 'command' &&
          (current.value as CommandMessage).command === 'dashboard'
        ) {
          return
        } else if (current.value.type !== 'dashboard') {
          setStopped(true)
          return
        } else {
          const dashboardMessage = current.value as DashboardMessage
          setState(dashboardMessage)
          return
        }
      },
    })
    return () => {
      context.messageBus.removeListener(id)
    }
  }, [context.messageBus])

  const restartDashboard = () => {
    setRestartDashboardLoading(true)
    context.messageBus
      .execute('dashboard', true)
      .then((_) => {
        setStopped(false)
      })
      .finally(() => {
        setRestartDashboardLoading(false)
      })
  }

  if (!state) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="animate-pulse">
          {i18n.t('hardcoded.msg_components_tableloadingmask_001')}
        </span>
      </div>
    )
  }
  return (
    <>
      <div
        className={clsx(
          'bg-warning-50 text-warning-700 border-bottom-1 border-bottom-divider sticky top-0 z-10 flex items-center justify-between px-3 py-2 text-sm',
          stopped ? undefined : 'hidden',
        )}
      >
        <div>
          {i18n.t('hardcoded.msg_pages_channel_param_tabs_dashboard_index_001')}
        </div>
        <Button
          color="warning"
          size="sm"
          variant="flat"
          onPress={restartDashboard}
          isLoading={isRestartDashboardLoading}
        >
          {i18n.t('hardcoded.msg_pages_channel_param_tabs_dashboard_index_002')}
        </Button>
      </div>
      <div className="spectre-container py-3 pb-16">
        <Card>
          <CardBody>
            <div className="header-2">
              {i18n.t(
                'hardcoded.msg_pages_channel_param_tabs_dashboard_index_003',
              )}
            </div>
            <KVGird>
              <KVGridItem
                name={i18n.t(
                  'hardcoded.msg_pages_channel_param_tabs_dashboard_index_004',
                )}
              >
                {state.runtimeInfo.javaVersion}
              </KVGridItem>
              <KVGridItem
                name={i18n.t(
                  'hardcoded.msg_pages_channel_param_tabs_dashboard_index_005',
                )}
              >
                {state.runtimeInfo.processors}
              </KVGridItem>
              <KVGridItem
                name={i18n.t(
                  'hardcoded.msg_pages_channel_param_tabs_dashboard_index_006',
                )}
              >
                <PercentageData rate={state.runtimeInfo.systemLoadAverage} />
              </KVGridItem>
              <KVGridItem
                name={i18n.t(
                  'hardcoded.msg_pages_channel_param_tabs_dashboard_index_007',
                )}
              >
                {(state.runtimeInfo.uptime / 60).toFixed(0)}
                {i18n.t(
                  'hardcoded.msg_pages_channel_param_tabs_dashboard_index_008',
                )}
              </KVGridItem>
            </KVGird>
          </CardBody>
        </Card>
        <MemoryChart lastMessage={state} />
        <ThreadTable threads={state.threads} />
      </div>
    </>
  )
}

export default DashBoardTab
