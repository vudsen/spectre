import { describe, expect, it } from 'vitest'
import { createMessageAggregator } from './messageAggregation.ts'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ArthasMessage } from './db.ts'

function createDefaultAggregator() {
  return createMessageAggregator([
    {
      runtimeNodeName: 'Aliyun',
      jvmName: 'math-game-2(vudsen/math-game:java25)',
      instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
    },
    {
      runtimeNodeName: 'Aliyun',
      jvmName: 'math-game-1(vudsen/math-game:java25)',
      instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
    },
  ])
}

function readSample(filename: string): Record<string, ArthasMessage[]> {
  return JSON.parse(
    readFileSync(resolve(__dirname, '__test_resources__', filename), {
      encoding: 'utf-8',
    }),
  ) as Record<string, ArthasMessage[]>
}

describe('aggregateCommandMessages', () => {
  it('Test basic', () => {
    const messages1 = readSample('tb-messages0.json')
    const aggregator = createDefaultAggregator()

    const group = aggregator.appendNewMessages([], messages1)
    expect(group.length).toBe(2)
  })

  it('Test basic2', () => {
    const messages1 = readSample('tb2-messages0.json')
    const messages2 = readSample('tb2-messages1.json')

    const aggregator = createMessageAggregator([
      {
        runtimeNodeName: 'Aliyun',
        jvmName: 'math-game-2(vudsen/math-game:java25)',
        instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
      },
      {
        runtimeNodeName: 'Aliyun',
        jvmName: 'math-game-1(vudsen/math-game:java25)',
        instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
      },
    ])

    const group = aggregator.appendNewMessages([], messages1)
    expect(group.length).toBe(1)
    const group2 = aggregator.appendNewMessages(group, messages2)
    expect(group2.length).toBe(1)
    expect(group2).toMatchSnapshot()
  })

  it('Test two command exec', () => {
    const messages0 = readSample('ttce-messages0.json')
    const messages1 = readSample('ttce-messages1.json')
    const messages2 = readSample('ttce-messages2.json')
    const messages3 = readSample('ttce-messages3.json')

    const aggregator = createDefaultAggregator()

    const groups0 = aggregator.appendNewMessages([], messages0)
    expect(groups0.length).toBe(1)
    const groups1 = aggregator.appendNewMessages(groups0, messages1)
    expect(groups1.length).toBe(1)
    // 连续执行相同命令仍然会被合并到同一个组中
    const groups2 = aggregator.appendNewMessages(groups1, messages2)
    expect(groups2.length).toBe(2)
    const groups3 = aggregator.appendNewMessages(groups2, messages3)
    expect(groups3.length).toBe(2)
    expect(groups3).matchSnapshot()
    // for (const testGroup of groups3) {
    //   expect(Object.keys(testGroup.instances).length).toBe(2)
    //   for (const value of Object.values(testGroup.instances)) {
    //     expect(value.length).toBe(8)
    //   }
    // }
  })
  it('Test full', () => {
    const sample = readSample('sample.json')
    const aggregator = createDefaultAggregator()

    const groups = aggregator.appendNewMessages([], sample)
    expect(groups.length).toBe(3)
    expect(groups).toMatchSnapshot()
  })

  it('Basic test3', () => {
    const messages0 = readSample('tb3-messages0.json')
    const messages1 = readSample('tb3-messages1.json')
    const messages2 = readSample('tb3-messages2.json')
    const messages3 = readSample('tb3-messages3.json')
    const messages4 = readSample('tb3-messages4.json')
    const messages5 = readSample('tb3-messages5.json')

    const aggregator = createDefaultAggregator()
    const groups0 = aggregator.appendNewMessages([], messages0)
    const groups1 = aggregator.appendNewMessages(groups0, messages1)
    const groups2 = aggregator.appendNewMessages(groups1, messages2)
    const groups3 = aggregator.appendNewMessages(groups2, messages3)
    const groups4 = aggregator.appendNewMessages(groups3, messages4)
    const groups5 = aggregator.appendNewMessages(groups4, messages5)

    expect(groups5.length).toBe(1)
    expect(Object.keys(groups5[0].instances).length).toBe(2)
    for (const [_, v] of Object.entries(groups5[0].instances)) {
      expect(v.length).toBe(5)
    }
    expect(groups5).toMatchSnapshot()
  })
})
