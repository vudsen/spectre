import { describe, expect, it } from 'vitest'
import { aggregateCommandMessages } from '@/pages/channel/[channelId]/messageAggregation.ts'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'

type RawMessage = {
  id: string
  instanceId: string
  command?: string
  type: string
  jobId?: number
  extra?: Record<string, unknown>
}

function buildMessages(items: RawMessage[]): ArthasMessage[] {
  return items.map((item, index) => {
    const payload: Record<string, unknown> = {
      type: item.type,
      jobId: item.jobId ?? index,
      ...(item.extra ?? {}),
    }
    if (item.type === 'command' && item.command) {
      payload.command = item.command
      payload.state = 'SUCCESS'
      payload.jobId = item.jobId ?? index
    }

    return {
      id: item.id,
      instanceId: item.instanceId,
      context: {
        channelId: 'channel-1',
        command: item.command,
        instanceId: item.instanceId,
      },
      value: payload as ArthasMessage['value'],
    }
  })
}

describe('aggregateCommandMessages', () => {
  it('merges same command in same sequence across instances', () => {
    const messages = buildMessages([
      { id: '1', instanceId: 'foo', type: 'command', command: 'help' },
      { id: '2', instanceId: 'foo', type: 'help' },
      { id: '3', instanceId: 'bar', type: 'command', command: 'help' },
      { id: '4', instanceId: 'bar', type: 'help' },
      { id: '5', instanceId: 'abc', type: 'command', command: 'version' },
      { id: '6', instanceId: 'abc', type: 'version' },
    ])

    const aggregated = aggregateCommandMessages(messages)

    expect(aggregated).toHaveLength(2)
    expect(aggregated[0].command).toBe('help')
    expect(aggregated[0].instances.foo).toHaveLength(1)
    expect(aggregated[0].instances.bar).toHaveLength(1)
    expect(aggregated[1].command).toBe('version')
    expect(aggregated[1].instances.abc).toHaveLength(1)
  })

  it('splits same command by sequence and keeps global command order', () => {
    const messages = buildMessages([
      { id: '1', instanceId: 'foo', type: 'command', command: 'help' },
      { id: '2', instanceId: 'foo', type: 'help' },
      { id: '3', instanceId: 'bar', type: 'command', command: 'watch' },
      { id: '4', instanceId: 'bar', type: 'watch', extra: { stack: 'xxx' } },
      { id: '5', instanceId: 'bar', type: 'watch', extra: { stack: 'xxx' } },
      { id: '6', instanceId: 'abc', type: 'command', command: 'version' },
      { id: '7', instanceId: 'abc', type: 'version' },
      { id: '8', instanceId: 'bar', type: 'command', command: 'help' },
      { id: '9', instanceId: 'bar', type: 'help' },
    ])

    const aggregated = aggregateCommandMessages(messages)

    expect(aggregated).toHaveLength(4)
    expect(aggregated.map((item) => item.command)).toEqual([
      'help',
      'watch',
      'version',
      'help',
    ])
    expect(aggregated[0].instances.foo).toHaveLength(1)
    expect(aggregated[3].instances.bar).toHaveLength(1)
  })
})
