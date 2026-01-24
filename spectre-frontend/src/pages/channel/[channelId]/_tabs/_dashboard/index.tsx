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
        <span className="animate-pulse">加载中</span>
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
        <div>Dashboard 任务已经停止</div>
        <Button
          color="warning"
          size="sm"
          variant="flat"
          onPress={restartDashboard}
          isLoading={isRestartDashboardLoading}
        >
          重新开始
        </Button>
      </div>
      <div className="spectre-container py-3 pb-16">
        <Card>
          <CardBody>
            <div className="header-2">系统信息</div>
            <KVGird>
              <KVGridItem name="Java 版本">
                {state.runtimeInfo.javaVersion}
              </KVGridItem>
              <KVGridItem name="处理器数量">
                {state.runtimeInfo.processors}
              </KVGridItem>
              <KVGridItem name="系统负载">
                <PercentageData rate={state.runtimeInfo.systemLoadAverage} />
              </KVGridItem>
              <KVGridItem name="存活时间">
                {(state.runtimeInfo.uptime / 60).toFixed(0)}分钟
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
