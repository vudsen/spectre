import type { FormHandle } from './CommandFormContent.tsx'
import i18n from '@/i18n'

type WatchValues = {
  classname: string
  methodName: string
  count: number
  depth: number
  expression: string
  extraArgs?: string
}

const DEFAULT_EXPRESSION = '{params, target, returnObj}'
const watch: FormHandle<WatchValues> = {
  name: 'Watch',
  defaultValues: {
    count: -1,
    depth: 3,
    expression: DEFAULT_EXPRESSION,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    {
      name: 'methodName',
      isRequired: true,
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_001',
      ),
    },
    [
      {
        name: 'count',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_002',
        ),
        type: 'number',
      },
      {
        name: 'depth',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_003',
        ),
        type: 'number',
      },
    ],
    {
      name: 'expression',
      label: i18n.t('hardcoded.msg_components_page_permissionslist_index_009'),
    },
    {
      name: 'extraArgs',
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_004',
      ),
    },
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

const trace: FormHandle<TraceValues> = {
  name: 'Trace',
  defaultValues: {
    count: -1,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    {
      name: 'methodName',
      isRequired: true,
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_001',
      ),
    },
    [
      {
        name: 'count',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_002',
        ),
        type: 'number',
      },
      {
        name: 'minCostMs',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_005',
        ),
        type: 'number',
      },
    ],
    {
      name: 'extraArgs',
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_004',
      ),
    },
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
const stack: FormHandle<StackValues> = {
  name: 'Stack',
  defaultValues: {
    count: -1,
  },
  items: [
    { name: 'classname', isRequired: true, label: 'Classname' },
    {
      name: 'methodName',
      isRequired: true,
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_001',
      ),
    },
    {
      name: 'count',
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_002',
      ),
      type: 'number',
    },
    {
      name: 'extraArgs',
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_004',
      ),
    },
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

type JadValues = {
  classname: string
}

const jad: FormHandle<JadValues> = {
  name: i18n.t(
    'hardcoded.msg_pages_channel_param_component_quickcommand_commands_006',
  ),
  buildCommand(values) {
    return `jad ${values.classname}`
  },
  items: [{ name: 'classname', isRequired: true, label: 'Classname' }],
  execute({ channelContext, values }) {
    channelContext.getTabsController().openTab('JAD', {}, values)
  },
  isSync: true,
}

type TTValues = {
  index: string
  count: number
  depth: number
  expression: string
  extraArgs?: string
}

const tt: FormHandle<TTValues> = {
  name: 'Time Tunnel',
  buildCommand(values) {
    let base = `tt -w '${values.expression}' -x ${values.depth} -i ${values.index}`
    if (values.count > 0) {
      base += ' -n ' + values.count
    }
    if (values.extraArgs) {
      base += ' ' + values.extraArgs
    }
    return base
  },
  defaultValues: {
    count: -1,
    depth: 3,
    expression: DEFAULT_EXPRESSION,
  },
  items: [
    { name: 'index', isRequired: true, label: 'Index', type: 'number' },
    [
      {
        name: 'count',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_002',
        ),
        type: 'number',
      },
      {
        name: 'depth',
        label: i18n.t(
          'hardcoded.msg_pages_channel_param_component_quickcommand_commands_003',
        ),
        type: 'number',
      },
    ],
    {
      name: 'expression',
      label: i18n.t('hardcoded.msg_components_page_permissionslist_index_009'),
    },
    {
      name: 'extraArgs',
      label: i18n.t(
        'hardcoded.msg_pages_channel_param_component_quickcommand_commands_004',
      ),
    },
  ],
}

export const quickCommandHandles = {
  watch,
  stack,
  trace,
  jad,
  tt,
}

export type QuickCommandKeys = keyof typeof quickCommandHandles
