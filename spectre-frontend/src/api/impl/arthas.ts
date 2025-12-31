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


export type ArthasResponse = {
  type: string
  jobId: number
}

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
