import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import type { CommandMessage } from '@/pages/channel/[channelId]/_message_view/_component/CommandMessageDetail.tsx'
import type { AggregatedCommandGroup } from '@/store/channelSlice.ts'

type GroupState = {
  command: string
  instances: Record<string, ArthasMessage[]>
}

export function aggregateCommandMessages(
  messages: ArthasMessage[],
): AggregatedCommandGroup[] {
  const groups: GroupState[] = []
  const groupByKey = new Map<string, GroupState>()
  const commandSeqByInstanceAndCommand = new Map<string, number>()
  const currentGroupKeyByInstance = new Map<string, string>()

  for (const message of messages) {
    if (message.value.type === 'command') {
      const command = (message.value as CommandMessage).command
      const commandCounterKey = `${message.instanceId}::${command}`
      const nextSeq =
        (commandSeqByInstanceAndCommand.get(commandCounterKey) ?? 0) + 1
      commandSeqByInstanceAndCommand.set(commandCounterKey, nextSeq)

      const groupKey = `${command}#${nextSeq}`
      currentGroupKeyByInstance.set(message.instanceId, groupKey)

      if (!groupByKey.has(groupKey)) {
        const group: GroupState = {
          command,
          instances: {},
        }
        groupByKey.set(groupKey, group)
        groups.push(group)
      }
      continue
    }

    const currentGroupKey = currentGroupKeyByInstance.get(message.instanceId)
    if (!currentGroupKey) {
      continue
    }

    const group = groupByKey.get(currentGroupKey)
    if (!group) {
      continue
    }

    if (!group.instances[message.instanceId]) {
      group.instances[message.instanceId] = []
    }
    group.instances[message.instanceId].push(message)
  }

  return groups.map((group) => ({
    command: group.command,
    instances: group.instances,
    version: 0,
  }))
}
