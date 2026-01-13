import type { FormHandle } from './CommandFormContent.tsx'

type WatchValues = {
  classname: string
  methodName: string
  count: number
  depth: number
  expression: string
  extraArgs?: string
}
const DEFAULT_EXPRESSION = '{params, target, returnObj}'
export const watch: FormHandle<WatchValues> = {
  name: 'Watch',
  defaultValues: {
    count: -1,
    depth: 3,
    expression: DEFAULT_EXPRESSION,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    { name: 'methodName', isRequired: true, label: '方法名' },
    [
      { name: 'count', label: '监听数量', type: 'number' },
      { name: 'depth', label: '递归深度', type: 'number' },
    ],
    { name: 'expression', label: '表达式' },
    { name: 'extraArgs', label: '额外参数' },
  ],
  buildCommand(values) {
    const commands: string[] = ['watch', values.classname, values.methodName]
    if (
      values.expression.length > 0 &&
      values.expression !== DEFAULT_EXPRESSION
    ) {
      commands.push(values.expression)
    }
    commands.push(`-x ${values.depth}`)
    if (values.count > 0) {
      commands.push(`-n ${values.count}`)
    }
    if (values.extraArgs && values.extraArgs.length > 0) {
      commands.push(values.extraArgs)
    }
    return commands.join(' ')
  },
}

type TraceValues = {
  classname: string
  methodName: string
  count: number
  minCostMs: number
  extraArgs?: string
}

export const trace: FormHandle<TraceValues> = {
  name: 'Trace',
  defaultValues: {
    count: -1,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    { name: 'methodName', isRequired: true, label: '方法名' },
    [
      { name: 'count', label: '监听数量', type: 'number' },
      { name: 'minCostMs', label: '最低耗时(ms)', type: 'number' },
    ],
    { name: 'extraArgs', label: '额外参数' },
  ],
  buildCommand(values) {
    const commands: string[] = ['trace', values.classname, values.methodName]

    if (values.minCostMs > 0) {
      commands.push(`'#cost > ${values.minCostMs}'`)
    }
    if (values.count > 0) {
      commands.push(`-n ${values.count}`)
    }
    if (values.extraArgs && values.extraArgs.length > 0) {
      commands.push(values.extraArgs)
    }
    return commands.join(' ')
  },
}

type StackValues = {
  classname: string
  methodName: string
  count: number
  extraArgs?: string
}
export const stack: FormHandle<StackValues> = {
  name: 'Stack',
  defaultValues: {
    count: -1,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    { name: 'methodName', isRequired: true, label: '方法名' },
    { name: 'count', label: '监听数量', type: 'number' },
    { name: 'extraArgs', label: '额外参数' },
  ],
  buildCommand(values) {
    const commands: string[] = ['stack', values.classname, values.methodName]

    if (values.count > 0) {
      commands.push(`-n ${values.count}`)
    }
    if (values.extraArgs && values.extraArgs.length > 0) {
      commands.push(values.extraArgs)
    }
    return commands.join(' ')
  },
}
