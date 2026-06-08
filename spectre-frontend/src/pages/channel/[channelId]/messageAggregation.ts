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
  key: string
}

const UNKNOWN = '<Unknown>'

function findKey(messagePart: ArthasMessage[]): string {
  for (const messagePartElement of messagePart) {
    if (messagePartElement.value.type === 'command') {
      return (messagePartElement.value as CommandMessage).command
    } else if (messagePartElement.value.type === 'status') {
      const msg = messagePartElement.value as StatusMessage
      return msg.message + msg.statusCode.toString()
    } else if (messagePartElement.value.type === 'message') {
      return (messagePartElement.value as MessageResponse).message
    }
  }
  return messagePart[0].value.type
}

function readAllSegments(messages: ArthasMessage[]): MessageSegment[] {
  if (messages.length === 0) {
    return []
  }
  let lastJobId = messages[0].value.jobId
  const result: MessageSegment[] = []
  const part: ArthasMessage[] = []
  let lastStart = 0
  let currentName = UNKNOWN
  let ended = false
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const arthasResponse = msg.value

    if (arthasResponse.jobId !== lastJobId) {
      result.push({
        message: [...part],
        jobId: lastJobId,
        name: currentName,
        isEnded: ended,
        key: findKey(part),
      })
      lastJobId = arthasResponse.jobId
      lastStart = i
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
  if (lastStart < messages.length - 1) {
    result.push({
      message: part,
      name: currentName,
      isEnded: ended,
      jobId: lastJobId,
      key: findKey(part),
    })
  }
  return result
}

/**
 * 尝试将消息追加到现有组
 */
function tryAppendExistGroup(
  instances: string[],
  headGroups: AggregatedCommandGroup[],
  segmentsMap: Record<string, MessageSegment[]>,
  pendingCombined: Record<string, ArthasMessage[]>,
) {
  for (let i = 1; i <= instances.length; i++) {
    const cur = headGroups.length - i
    if (cur < 0) {
      break
    }
    let group = headGroups[cur]
    let isCloned = false
    for (const instanceId of instances) {
      const segments = segmentsMap[instanceId]
      if (segments.length === 0) {
        continue
      }
      const segment = segments[0]
      if (segment.key !== group.key || segment.message.length === 0) {
        continue
      }
      const temp = group.instances[instanceId]
      if (
        temp &&
        temp.length > 0 &&
        segment.jobId !== temp[temp.length - 1].value.jobId
      ) {
        continue
      }

      let cloned: AggregatedCommandGroup
      if (isCloned) {
        cloned = group
      } else {
        cloned = deepClone(group)
        group = cloned
        isCloned = true
      }

      const currentMessages = cloned.instances[instanceId]
      if (!currentMessages || currentMessages.length === 0) {
        cloned.instances[instanceId] = segment.message
      } else {
        const tailJobId = segment.jobId
        let j = currentMessages.length - 1
        for (; j >= 0; j--) {
          if (currentMessages[j].value.jobId != tailJobId) {
            break
          }
        }
        if (j < 0) {
          // same part
          cloned.instances[instanceId] = segment.message
        } else {
          cloned.instances[instanceId] = [
            ...currentMessages.slice(0, j + 1),
            ...segment.message,
          ]
        }
      }

      headGroups[cur] = cloned
      segments.splice(0, 1)
      if (segment.isEnded) {
        pendingCombined[instanceId].splice(0, segment.message.length)
      }
    }
  }
}

export const createMessageAggregator = (instances: InstanceInfoVO[]) => {
  const pendingCombined: Record<string, ArthasMessage[]> = {}

  for (const instance of instances) {
    pendingCombined[instance.instanceId] = []
  }

  function appendNewMessages(
    readonlyCurrentGroups: AggregatedCommandGroup[],
    newMessages: Record<string, ArthasMessage[]>,
  ): AggregatedCommandGroup[] {
    const newGroups: AggregatedCommandGroup[] = []
    const segmentsMap: Record<string, MessageSegment[]> = {}
    const instances: string[] = Object.keys(pendingCombined)
    let ptr = 0

    for (const [k, v] of Object.entries(newMessages)) {
      for (const vElement of v) {
        if (vElement.value.type === 'input_status') {
          continue
        }
        pendingCombined[k].push(vElement)
      }
      segmentsMap[k] = readAllSegments(pendingCombined[k])
    }

    const headGroups: AggregatedCommandGroup[] = [...readonlyCurrentGroups]

    tryAppendExistGroup(instances, headGroups, segmentsMap, pendingCombined)

    for (const instanceId of instances) {
      const segments = segmentsMap[instanceId]
      for (const segment of segments) {
        if (segment.isEnded) {
          pendingCombined[instanceId].splice(0, segment.message.length)
        }
      }
    }

    while (true) {
      let emptyCnt = 0
      for (let i = 0; i < instances.length; i++) {
        if (segmentsMap[instances[i]].length === 0) {
          emptyCnt++
        }
      }
      if (emptyCnt === instances.length) {
        break
      }

      const current = segmentsMap[instances[ptr]]
      if (current.length === 0) {
        ptr = (ptr + 1) % instances.length
        continue
      }
      const currentLast = current[current.length - 1]
      // search for group
      const group: AggregatedCommandGroup = {
        key: currentLast.key,
        command: currentLast.name,
        instances: {
          [instances[ptr]]: [...currentLast.message],
        },
      }
      current.pop()
      for (let i = 1; i < instances.length; i++) {
        const messageSegments =
          segmentsMap[instances[(ptr + i) % instances.length]]
        if (messageSegments.length === 0) {
          continue
        }
        const seg = messageSegments[messageSegments.length - 1]
        if (seg.key === currentLast.key) {
          group.instances[instances[(ptr + i) % instances.length]] = seg.message
          messageSegments.pop()
        }
      }
      newGroups.push(group)
      ptr = (ptr + 1) % instances.length
    }
    return [...headGroups, ...newGroups.reverse()]
  }

  function clear() {
    for (const key of Object.keys(pendingCombined)) {
      pendingCombined[key] = []
    }
  }
  return {
    appendNewMessages,
    clear,
  }
}
