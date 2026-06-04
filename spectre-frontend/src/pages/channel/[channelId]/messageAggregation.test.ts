import { describe, expect, it } from 'vitest'
import { createMessageAggregator } from '@/pages/channel/[channelId]/messageAggregation.ts'

describe('aggregateCommandMessages', () => {
  it('Test basic', () => {
    const messages1 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780557349700',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1383,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780557349701',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557349702',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 54,
              listenerId: 66,
              methodCount: 1,
            },
            jobId: 1383,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780557349706',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            accessPoint: 'AtExceptionExit',
            className: 'demo.MathGame',
            cost: 0.115492,
            jobId: 1383,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 07:15:51.072460075',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    null,\n]',
          },
        },
        {
          id: '1780557349707',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            jobId: 1383,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780557349708',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557349702',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557357185',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1384,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780557357186',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557357187',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 50,
              listenerId: 67,
              methodCount: 1,
            },
            jobId: 1384,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780557357188',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 0.096312,
            jobId: 1384,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 07:15:59.074785570',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=3],\n]',
          },
        },
        {
          id: '1780557357189',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            jobId: 1384,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780557357190',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780557357187',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780557349703',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1400,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780557349704',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557349705',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 57,
              listenerId: 69,
              methodCount: 1,
            },
            jobId: 1400,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780557349709',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 0.083031,
            jobId: 1400,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 07:15:52.023693110',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=6],\n]',
          },
        },
        {
          id: '1780557349710',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            jobId: 1400,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780557349711',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557349703',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557357191',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1401,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780557357192',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780557357193',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 50,
              listenerId: 70,
              methodCount: 1,
            },
            jobId: 1401,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780557357194',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 0.063613,
            jobId: 1401,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 07:15:59.027314505',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=6],\n]',
          },
        },
        {
          id: '1780557357195',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            jobId: 1401,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780557357196',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780557357188',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
    }
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
  })

  it('Test basic2', () => {
    const messages1 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780554408906',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1284,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554408907',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554408908',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 48,
              listenerId: 59,
              methodCount: 1,
            },
            jobId: 1284,
            success: true,
            type: 'enhancer',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780554408903',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1301,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554408904',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554408905',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 46,
              listenerId: 62,
              methodCount: 1,
            },
            jobId: 1301,
            success: true,
            type: 'enhancer',
          },
        },
      ],
    }

    const messages2 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780554408909',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            accessPoint: 'AtExceptionExit',
            className: 'demo.MathGame',
            cost: 0.146553,
            jobId: 1284,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:27:00.372021089',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    null,\n]',
          },
        },
        {
          id: '1780554408910',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            jobId: 1284,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554408911',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554408906',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780554408912',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 2.763648,
            jobId: 1301,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:27:00.334063341',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=1],\n]',
          },
        },
        {
          id: '1780554408913',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            jobId: 1301,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554408914',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554408905',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
    }

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
    expect(Object.keys(group2[0].instances).length).toBe(2)
    for (const value of Object.values(group2[0].instances)) {
      expect(value.length).toBe(6)
    }
  })

  it('Test two command exec', () => {
    const messages0 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780554921961',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1300,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554921962',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554921963',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 65,
              listenerId: 60,
              methodCount: 1,
            },
            jobId: 1300,
            success: true,
            type: 'enhancer',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [],
    }
    const messages1 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780554921964',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 0.236531,
            jobId: 1300,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:35:25.496947833',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=3],\n]',
          },
        },
        {
          id: '1780554921965',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            jobId: 1300,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554921966',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921963',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780554921967',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1317,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554921968',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554921969',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 59,
              listenerId: 63,
              methodCount: 1,
            },
            jobId: 1317,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780554921970',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            accessPoint: 'AtExit',
            className: 'demo.MathGame',
            cost: 0.07937,
            jobId: 1317,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:35:27.450856750',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    @ArrayList[isEmpty=false;size=5],\n]',
          },
        },
        {
          id: '1780554921971',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            jobId: 1317,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554921972',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921964',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
    }

    const messages2 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [
        {
          id: '1780554921973',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1304,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554921974',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554921975',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 49,
              listenerId: 61,
              methodCount: 1,
            },
            jobId: 1304,
            success: true,
            type: 'enhancer',
          },
        },
        {
          id: '1780554921976',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            accessPoint: 'AtExceptionExit',
            className: 'demo.MathGame',
            cost: 0.104911,
            jobId: 1304,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:35:34.503708268',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    null,\n]',
          },
        },
        {
          id: '1780554921977',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            jobId: 1304,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554921978',
          instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ',
            id: '1780554921965',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780554921979',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            command: 'watch demo.MathGame primeFactors -n 1',
            jobId: 1322,
            state: 'SCHEDULED',
            type: 'command',
          },
        },
        {
          id: '1780554921980',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            inputStatus: 'ALLOW_INTERRUPT',
            jobId: 0,
            type: 'input_status',
          },
        },
        {
          id: '1780554921981',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            effect: {
              classCount: 1,
              cost: 46,
              listenerId: 64,
              methodCount: 1,
            },
            jobId: 1322,
            success: true,
            type: 'enhancer',
          },
        },
      ],
    }

    const messages3 = {
      '-5SoRLH65lkoqSw2OyH2uxcbKjBbopgI6EWnj3D0hdQ': [],
      'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI': [
        {
          id: '1780554921982',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            accessPoint: 'AtExceptionExit',
            className: 'demo.MathGame',
            cost: 0.087037,
            jobId: 1322,
            methodName: 'primeFactors',
            sizeLimit: 10485760,
            ts: '2026-06-04 06:35:37.455440300',
            type: 'watch',
            value:
              '@ArrayList[\n    @Object[][isEmpty=false;size=1],\n    @MathGame[demo.MathGame@3aafb60c],\n    null,\n]',
          },
        },
        {
          id: '1780554921983',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            jobId: 1322,
            statusCode: 0,
            type: 'status',
          },
        },
        {
          id: '1780554921984',
          instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
          context: {
            command: 'watch demo.MathGame primeFactors -n 1',
            instanceId: 'ob5MJ4tJmvn_IEd-CItRhOvV8Ld5yy2Kd--_XtD0BLI',
            id: '1780554921966',
          },
          value: {
            inputStatus: 'ALLOW_INPUT',
            jobId: 0,
            type: 'input_status',
          },
        },
      ],
    }

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

    const groups0 = aggregator.appendNewMessages([], messages0)
    expect(groups0.length).toBe(1)
    const groups1 = aggregator.appendNewMessages(groups0, messages1)
    expect(groups1.length).toBe(1)
    // 连续执行相同命令仍然会被合并到同一个组中
    const groups2 = aggregator.appendNewMessages(groups1, messages2)
    expect(groups2.length).toBe(1)
    const groups3 = aggregator.appendNewMessages(groups2, messages3)
    expect(groups3.length).toBe(1)
    expect(groups3).matchSnapshot()
    // for (const testGroup of groups3) {
    //   expect(Object.keys(testGroup.instances).length).toBe(2)
    //   for (const value of Object.values(testGroup.instances)) {
    //     expect(value.length).toBe(8)
    //   }
    // }
  })
})
