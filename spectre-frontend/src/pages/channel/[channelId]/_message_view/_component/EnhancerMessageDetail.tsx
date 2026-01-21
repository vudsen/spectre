import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'

type EnhancerMessage = {
  effect: {
    classCount: number
    cost: number
    listenerId: number
    methodCount: 1
  }
  jobId: number
  success: boolean
  fid: number
  type: 'enhancer'
}

const EnhancerMessageDetail: React.FC<DetailComponentProps<EnhancerMessage>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div className="font-bold">Enhancer 影响范围</div>
      <div>
        涉及 class 数量: <Code>{props.msg.effect.classCount}</Code>
      </div>
      <div>
        方法数量: <Code>{props.msg.effect.methodCount}</Code>
      </div>
      <div>
        耗时: <Code>{props.msg.effect.cost}ms</Code>
      </div>
    </div>
  )
}

export default EnhancerMessageDetail
