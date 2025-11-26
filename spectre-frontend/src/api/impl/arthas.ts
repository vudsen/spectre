import axios from 'axios'

export type AttachStatus = {
  isReady: boolean
  channelId?: string
  title?: string
  message?: string
  error?: {
    message: string
    nextRetryTime: number
  }
}

/**
 * 创建频道
 * @return channel id
 */
export const createChannel = (
  runtimeNodeId: string,
  treeNodeId: string,
  bundleId: string,
): Promise<AttachStatus> => {
  return axios.post('arthas/create-channel', {
    bundleId,
    treeNodeId,
    runtimeNodeId,
  })
}

export type ChannelSessionDTO = {
  consumerId: string
  name: string
}

/**
 * @return Consumer ID
 */
export const joinChannel = (
  channelId: string,
): Promise<ChannelSessionDTO | undefined> => {
  return axios.post(`arthas/channel/${channelId}/join`)
}

export type InputStatusResponse = {
  type: 'input_status'
  inputStatus: 'ALLOW_INPUT' | 'DISABLED' | 'ALLOW_INTERRUPT'
  jobId: number
}

export type MessageResponse = {
  type: 'message'
  jobId: number
  message: string
}

export type WelcomeMessage = {
  type: 'welcome'
  jobId: number
  mainClass: string
  pid: string
  time: string
  tutorials: string
  version: string
  wiki: string
}

export type CommandMessage = {
  type: 'command'
  jobId: number
  state: string
  command: string
  message?: string
}

export type VersionMessage = {
  type: 'version'
  version: string
  jobId: number
}

export type StatusMessage = {
  type: 'status'
  statusCode: number
  jobId: number
  message?: string
}

export type ClassLoaderMessage = {
  type: 'classloader'
  jobId: number
  classLoaderStats: Record<
    string,
    {
      loadedCount: number
      numberOfInstance: number
    }
  >
}

export type RowAffectedMessage = {
  type: 'row_affect'
  jobId: number
  rowCount: number
}

export type WatchMessage = {
  type: 'watch'
  jobId: number
  accessPoint: string
  className: string
  cost: number
  methodName: string
  sizeLimit: number
  ts: string
  value: string
}

export type ArthasResponse =
  | RowAffectedMessage
  | ClassLoaderMessage
  | StatusMessage
  | VersionMessage
  | CommandMessage
  | InputStatusResponse
  | WelcomeMessage
  | MessageResponse
  | WatchMessage

export const pullResults = (channelId: string): Promise<ArthasResponse[]> => {
  return axios.get(`arthas/channel/${channelId}/pull-result`, {
    meta: {
      skipErrorHandler: true,
    },
  })
}

export const executeArthasCommand = (channelId: string, command: string) => {
  return axios.post(`arthas/channel/${channelId}/execute`, {
    command,
  })
}

export const disconnectSession = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/disconnect`)
}

export const interruptCommand = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/interrupt`)
}
