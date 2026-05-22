import axios from 'axios'

export type AttachStatus = {
  isReady: boolean
  channelId?: string
  title?: string
  message?: string
  error?: {
    message: string
    nextRetryTime: string
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

export type PureArthasResponse = {
  type: string
  jobId: number
}

export const pullResults = async (
  channelId: string,
): Promise<PureArthasResponse[]> =>
  axios.get(`arthas/channel/${channelId}/pull-result`)

export const executeArthasCommand = (channelId: string, command: string) => {
  return axios.post(`arthas/channel/${channelId}/execute`, {
    command,
  })
}

export const executeArthasCommandSync = (
  channelId: string,
  command: string,
): Promise<PureArthasResponse[]> => {
  return axios.post(`arthas/channel/${channelId}/execute-sync`, {
    command,
  })
}

export const disconnectSession = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/disconnect`)
}

export const interruptCommand = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/interrupt`)
}

export type ProfilerFile = {
  timestamp: string
  channelId: string
  extension: string
}

export const listProfilerFiles = (
  channelId: string,
): Promise<ProfilerFile[]> => {
  return axios.get(`arthas/channel/${channelId}/profiler-files`)
}

type ChannelCreateVO = {
  runtimeNodeId: string
  treeNodeId: string
  bundleId: string
}

/**
 * @return treeNodeId to status
 */
export const batchCreateInstances = (
  vos: ChannelCreateVO[],
): Promise<Record<string, AttachStatus>> =>
  axios.post('arthas/batch/create-instances', vos)

/**
 * @return channelId
 */
export const createBatchChannel = (instanceIds: string[]): Promise<string> =>
  axios.post('arthas/batch/create-channel', instanceIds)

type ChannelInfoVO = {
  runtimeNodeName: string
  jvmName: string
  instanceId: string
}

export const joinBatchChannel = (channelId: string): Promise<ChannelInfoVO[]> =>
  axios.post('arthas/batch/join?channelId=' + channelId)

type BatchExecuteRequest = {
  channelId: string
  command: string
}
export const batchExecute = (body: BatchExecuteRequest) =>
  axios.post('arthas/batch/execute', body)

export const batchPullResult = (
  channelId: string,
): Promise<Record<string, PureArthasResponse[]>> =>
  axios.get('arthas/batch/pull-result?channelId=' + channelId)
