import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import { Accordion, AccordionItem, Card, CardBody } from '@heroui/react'
import KVGird from '@/components/KVGird'
import KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import ThreadTable from '@/pages/channel/[channelId]/_tabs/_dashboard/ThreadTable.tsx'
import React from 'react'
import PercentageData from '@/pages/channel/[channelId]/_tabs/_dashboard/PercentageData.tsx'
import StackTrace from '@/pages/channel/[channelId]/_message_view/_component/_common/StackTrace.tsx'

type Thread = {
  cpu: number
  daemon: boolean
  deltaTime: number
  group: string
  id: number
  interrupted: boolean
  name: string
  priority: number
  state: string
  time: number
}

type Trace = {
  fileName: string
  lineNumber: number
  className: string
  methodName: string
}

type BusyThread = {
  blockedCount: number
  blockedTime: number
  cpu: number
  daemon: boolean
  deltaTime: number
  group: string
  id: number
  isNative: boolean
  lockInfo?: Record<string, string>
  lockName?: string
  lockOwnerId: number
  lockedMonitors: string[]
  lockedSynchronizers: string[]
  name: string
  priority: number
  stackTrace: Trace[]
  state: string
  suspended: boolean
  time: number
  waitedCount: number
  waitedTime: number
}

type ThreadInfo = {
  blockedCount: number
  blockedTime: number
  daemon: boolean
  inNative: boolean
  lockInfo?: {
    className: string
    identityHashCode: number
  }
  lockName: string
  lockOwnerId: number
  lockedMonitors: string[]
  lockedSynchronizers: string[]
  priority: number
  stackTrace: Trace[]
  suspended: boolean
  threadId: number
  threadName: string
  threadState: string
  waitedCount: number
  waitedTime: number
}

type ThreadMessage = {
  all: boolean
  jobId: number
  type: 'thread'
  threadStats?: Thread[]
  threadStateCount?: Record<string, number>
  busyThreads?: BusyThread[]
  threadInfo?: ThreadInfo
}

const BusyThreadsDisplay: React.FC<{
  busyThreads: BusyThread[]
  onDirty?: () => void
}> = ({ busyThreads, onDirty }) => {
  return (
    <Accordion isCompact>
      {busyThreads.map((thread) => (
        <AccordionItem
          classNames={{ trigger: 'cursor-pointer' }}
          key={thread.id}
          aria-label={thread.name}
          title={
            <div className="text-default-400 text-sm">
              <span className="text-primary text-base">{thread.name}</span>
              <span className="ml-2">Id={thread.id} cpuUsage=</span>
              <PercentageData rate={thread.cpu} />
              <span className="ml-2">
                deltaTime={thread.deltaTime}ms time={thread.time}ms{' '}
              </span>
              <span className="text-secondary">{thread.state}</span>
            </div>
          }
        >
          <StackTrace traces={thread.stackTrace} onDirty={onDirty} />
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const SingleThreadInfo: React.FC<{
  threadInfo: ThreadInfo
  onDirty?: () => void
}> = ({ threadInfo, onDirty }) => {
  return (
    <div>
      <div className="text-default-400 text-sm">
        <span className="text-primary text-base">{threadInfo.threadName}</span>
        <span className="ml-2">
          Id={threadInfo.threadId} {threadInfo.threadState}
        </span>
        {threadInfo.lockInfo ? (
          <span>
            &nbsp;on {threadInfo.lockInfo.className}@
            {threadInfo.lockInfo.identityHashCode}
          </span>
        ) : null}
      </div>
      <StackTrace onDirty={onDirty} traces={threadInfo.stackTrace} />
    </div>
  )
}

const ThreadMessageDetail: React.FC<DetailComponentProps<ThreadMessage>> = ({
  msg,
  onDirty,
}) => {
  if (msg.threadStateCount && msg.threadStats) {
    return (
      <div className="space-y-3">
        <Card>
          <CardBody>
            <div className="header-2">线程统计</div>
            <KVGird>
              {Object.entries(msg.threadStateCount).map((cnt) => (
                <KVGridItem name={cnt[0]} key={cnt[0]}>
                  {cnt[1]}
                </KVGridItem>
              ))}
            </KVGird>
          </CardBody>
        </Card>
        {/*偷个懒*/}
        <ThreadTable threads={msg.threadStats} />
      </div>
    )
  } else if (msg.busyThreads) {
    return (
      <BusyThreadsDisplay busyThreads={msg.busyThreads} onDirty={onDirty} />
    )
  } else if (msg.threadInfo) {
    return <SingleThreadInfo threadInfo={msg.threadInfo} onDirty={onDirty} />
  }
}
export default ThreadMessageDetail
