import React, { useContext } from 'react'
import { Link } from '@heroui/react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import i18n from '@/i18n'

type GcInfo = {
  collectionCount: number
  collectionTime: number
  name: string
}
export type MemoryInfo = {
  max: number
  name: string
  total: number
  type: string
  used: number
}

type RuntimeInfo = {
  javaHome: string
  javaVersion: string
  osName: string
  osVersion: string
  processors: number
  systemLoadAverage: number
  timestamp: number
  uptime: number
}

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

export type DashboardMessage = {
  gcInfos: GcInfo[]
  jobId: number
  memoryInfo: {
    heap: MemoryInfo[]
    nonheap: MemoryInfo[]
    buffer_pool: MemoryInfo[]
  }
  runtimeInfo: RuntimeInfo
  threads: Thread[]
  type: 'dashboard'
}

export const DashboardMessageDetail: React.FC = () => {
  const context = useContext(ChannelContext)
  const openDashboard = () => {
    context.getTabsController().openTab('DASHBOARD', {})
  }
  return (
    <div>
      <div className="text-warning">
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_dashboardmessagedetail_001',
        )}
      </div>
      <Link
        size="sm"
        className="cursor-pointer"
        color="primary"
        underline="always"
        onPress={openDashboard}
      >
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_dashboardmessagedetail_002',
        )}
      </Link>
    </div>
  )
}

export default DashboardMessageDetail
