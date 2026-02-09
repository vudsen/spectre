import React, { useImperativeHandle } from 'react'
import type { FormComponentProps } from '@/ext/type.ts'
import { Button } from '@heroui/react'
import ControlledCheckbox from '@/components/validation/ControlledCheckbox.tsx'
import { useForm } from 'react-hook-form'
import type { PolicyPermissionEnhancePlugin } from '@/api/impl/permission.ts'

const commands = [
  'auth',
  'base64',
  'cat',
  'classloader',
  'cls',
  'dashboard',
  'dump',
  'echo',
  'getstatic',
  'grep',
  'heapdump',
  'help',
  'history',
  'jad',
  'jfr',
  'jvm',
  'keymap',
  'logger',
  'mbean',
  'mc',
  'memory',
  'monitor',
  'ognl',
  'options',
  'perfcounter',
  'profiler',
  'pwd',
  'quit',
  'redefine',
  'reset',
  'retransform',
  'sc',
  'session',
  'sm',
  'stack',
  'stop',
  'sysenv',
  'sysprop',
  'tee',
  'thread',
  'trace',
  'tt',
  'version',
  'vmoption',
  'vmtool',
  'watch',
]

type Values = {
  allowedCommands?: Record<string, boolean>
  allowUnknownCommand?: boolean
  allowRedirect?: boolean
}

type ArthasExecutionConfiguration = {
  allowedCommands: string[]
  allowUnknownCommand: boolean
  allowRedirect: boolean
}

/**
 * 增强 Arthas 执行鉴权，支持精细到命令级别
 * Extension Point: PolicyAuthenticationExtensionPoint
 */
const ArthasExecutionPermissionFrom: React.FC<FormComponentProps> = (props) => {
  const { control, setValue, trigger, getValues } = useForm<Values>({
    defaultValues: async () => {
      if (!props.oldState) {
        return {}
      }
      const oldState = props.oldState as ArthasExecutionConfiguration
      const allowedCommands: Record<string, boolean> = {}
      for (const allowedCommand of oldState.allowedCommands) {
        allowedCommands[allowedCommand] = true
      }

      return {
        allowUnknownCommand: oldState.allowUnknownCommand,
        allowRedirect: oldState.allowRedirect,
        allowedCommands,
      }
    },
  })
  const onSelectAll = () => {
    // props.control.set
    const base: Record<string, boolean> = {}
    for (const command of commands) {
      base[command] = true
    }
    setValue('allowedCommands', base)
  }

  useImperativeHandle(props.ref, () => ({
    collect: async () => {
      if (!(await trigger())) {
        return
      }
      const values = getValues()
      const myConf: ArthasExecutionConfiguration = {
        allowedCommands: [],
        allowRedirect: values.allowRedirect ?? false,
        allowUnknownCommand: values.allowUnknownCommand ?? false,
      }
      if (values.allowedCommands) {
        for (const entry of Object.entries(values.allowedCommands)) {
          const [command, enable] = entry
          if (enable) {
            myConf.allowedCommands.push(command)
          }
        }
      }
      return {
        configuration: JSON.stringify(myConf),
        pluginId: props.pluginId,
      } satisfies PolicyPermissionEnhancePlugin
    },
  }))

  return (
    <div className="space-y-3">
      <div>
        <div className="my-4 text-lg">安全配置</div>
        <div>
          <ControlledCheckbox
            control={control}
            name="allowUnknownCommand"
            checkboxProps={{}}
          >
            允许未知命令
          </ControlledCheckbox>
          <ControlledCheckbox
            control={control}
            name="allowRedirect"
            checkboxProps={{
              className: 'mx-3',
            }}
          >
            允许重定向符
          </ControlledCheckbox>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-lg">允许执行的命令</div>
        <Button color="primary" variant="light" onPress={onSelectAll}>
          全选
        </Button>
      </div>
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {commands.map((command) => (
            <ControlledCheckbox
              key={command}
              control={control}
              name={`allowedCommands.${command}`}
              checkboxProps={{
                className: 'text-sm',
              }}
            >
              {command}
            </ControlledCheckbox>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArthasExecutionPermissionFrom
