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
  fid: number
  inputStatus: 'ALLOW_INPUT' | 'DISABLED' | 'ALLOW_INTERRUPT'
  jobId: number
}

type ArthasResponse = {
  type: string
  jobId: number
}

export type ArthasResponseWithId = ArthasResponse & {
  /**
   * arthas 实际没用这个值，这个是给前端识别用的
   */
  fid: number
}
let fid = Date.now()

function applyIdForArthasResponse(r: unknown): Promise<ArthasResponseWithId[]> {
  const resp = r as ArthasResponse[]
  const result: ArthasResponseWithId[] = []
  for (const arthasRespons of resp) {
    result.push({
      ...arthasRespons,
      fid: fid++,
    })
  }
  return Promise.resolve(result)
}

export const pullResults = async (
  channelId: string,
): Promise<ArthasResponseWithId[]> =>
  axios
    .get(`arthas/channel/${channelId}/pull-result`, {
      meta: {
        skipErrorHandler: true,
      },
    })
    .then(applyIdForArthasResponse)

export const executeArthasCommand = (channelId: string, command: string) => {
  return axios.post(`arthas/channel/${channelId}/execute`, {
    command,
  })
}

export const executeArthasCommandSync = (
  channelId: string,
  command: string,
): Promise<ArthasResponseWithId[]> => {
  return axios
    .post(`arthas/channel/${channelId}/execute-sync`, {
      command,
    })
    .then(applyIdForArthasResponse)
}

export const disconnectSession = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/disconnect`)
}

export const interruptCommand = (channelId: string) => {
  return axios.post(`arthas/channel/${channelId}/interrupt`)
}
