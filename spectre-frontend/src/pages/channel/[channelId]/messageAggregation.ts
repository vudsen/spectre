import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { CommandMessage } from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'
import type { AggregatedCommandGroup } from '@/store/channelSlice.ts'
import type { MessageResponse } from '@/pages/channel/[channelId]/_message_view/_component/MessageDetail.tsx'
import type { InstanceInfoVO } from '@/api/impl/arthas.ts'
import type { StatusMessage } from '@/pages/channel/[channelId]/_message_view/_component/StatusMessageDetail.tsx'
import { deepClone } from '@/common/objects.ts'

type MessageSegment = {
  jobId: number
  name: string
  message: ArthasMessage[]
  isEnded: boolean
  /**
   * command
   */
  command: string
}

const UNKNOWN = '<Unknown>'

function readAllSegments(messages: ArthasMessage[]): MessageSegment[] {
  const filteredMessages = messages.filter(
    (msg) => msg.value.type !== 'input_status',
  )
  if (filteredMessages.length === 0) {
    return []
  }
  let lastJobId = filteredMessages[0].value.jobId
  const result: MessageSegment[] = []
  const part: ArthasMessage[] = []
  let currentName = filteredMessages[0].context.command ?? UNKNOWN
  let ended = false
  for (let i = 0; i < filteredMessages.length; i++) {
    const msg = filteredMessages[i]
    const arthasResponse = msg.value

    if (arthasResponse.jobId !== lastJobId) {
      result.push({
        message: [...part],
        jobId: lastJobId,
        name: currentName,
        isEnded: ended,
        command: part[0].context.command ?? currentName,
      })
      lastJobId = arthasResponse.jobId
      currentName = UNKNOWN
      ended = false
      part.splice(0, part.length)
    }
    part.push(msg)

    if (msg.value.type === 'command') {
      currentName = (msg.value as CommandMessage).command
    } else if (msg.value.type === 'message') {
      currentName = (msg.value as MessageResponse).message
    } else if (msg.value.type === 'status') {
      const status = msg.value as StatusMessage
      ended = true
      if (currentName === UNKNOWN) {
        currentName =
          msg.context.command ?? status.message ?? 'Unknown Command Context'
      }
    }
  }
  if (part.length > 0) {
    result.push({
      message: part,
      name: currentName,
      isEnded: ended,
      jobId: lastJobId,
      command: part[0].context.command ?? currentName,
    })
  }
  return result
}

export const createMessageAggregator = (instances: InstanceInfoVO[]) => {
  const instancesIds: string[] = instances.map((ins) => ins.instanceId)

  function appendNewMessages(
    readonlyCurrentGroups: AggregatedCommandGroup[],
    newMessages: Record<string, ArthasMessage[]>,
  ): AggregatedCommandGroup[] {
    const segmentsMap: Record<string, MessageSegment[]> = {}

    for (const [k, v] of Object.entries(newMessages)) {
      segmentsMap[k] = readAllSegments(v)
    }

    const newGroups: AggregatedCommandGroup[] = [...readonlyCurrentGroups]
    while (true) {
      let emptyCnt = 0
      for (const instancesId of instancesIds) {
        if (segmentsMap[instancesId].length === 0) {
          emptyCnt++
          continue
        }
        const segements = segmentsMap[instancesId]
        let currentGroup: AggregatedCommandGroup | undefined
        let groupIndex = -1
        for (let i = newGroups.length - 1; i >= 0; i--) {
          // 找到最近的组
          const group = newGroups[i]
          if (group.command !== segements[0].command) {
            continue
          }
          const saved = group.instances[instancesId]
          if (saved && saved[0].value.jobId === segements[0].jobId) {
            currentGroup = group
            groupIndex = i
          } else if (!saved) {
            currentGroup = group
            groupIndex = i
          }
          break
        }
        if (currentGroup) {
          // 找到了，追加
          const newGroup = deepClone(currentGroup)
          newGroups[groupIndex] = newGroup
          const old = newGroup.instances[instancesId]
          if (old) {
            old.push(...segements[0].message)
          } else {
            newGroup.instances[instancesId] = segements[0].message
          }
        } else {
          // 没找到，新增组
          newGroups.push({
            command: segements[0].command,
            instances: {
              [instancesId]: segements[0].message,
            },
          })
        }
        segements.splice(0, 1)
      }
      if (emptyCnt === instancesIds.length) {
        break
      }
    }

    return newGroups
  }

  return {
    appendNewMessages,
  }
}
