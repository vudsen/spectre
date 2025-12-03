import React, { useState, type KeyboardEvent } from 'react'
import ControlledTextarea from '@/components/validation/ControlledTextarea.tsx'
import { addToast, Button, Tooltip } from '@heroui/react'
import { useForm } from 'react-hook-form'
import {
  executeArthasCommand,
  type InputStatusResponse,
  interruptCommand,
} from '@/api/impl/arthas.ts'

interface CommandExecuteBlockProps {
  channelId: string
  inputStatus: InputStatusResponse['inputStatus']
  onExecute: () => void
}

type FromState = {
  command: string
}

const CommandExecuteBlock: React.FC<CommandExecuteBlockProps> = (props) => {
  const { control, trigger, getValues, reset, setValue } = useForm<FromState>()
  const [loading, setLoading] = useState(false)

  const execute = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    setLoading(true)
    try {
      await executeArthasCommand(props.channelId, values.command)
      reset({ command: '' })
    } finally {
      props.onExecute()
      setLoading(false)
    }
  }

  const interrupt = () => {
    setLoading(true)
    interruptCommand(props.channelId)
      .then(() => {
        addToast({
          title: '中断前台任务成功',
          color: 'success',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') {
      return
    }
    if (e.altKey) {
      const value = getValues()
      setValue('command', (value.command ?? '') + '\n')
      return
    }

    e.preventDefault()
    execute().then()
  }

  return (
    <div className="border-t-divider flex flex-col border-t p-3">
      <ControlledTextarea
        control={control}
        name="command"
        rules={{ required: true }}
        inputProps={{
          onKeyDown: onKeyDown,
          spellCheck: 'false',
          placeholder: '请输入命令, 使用`回车`执行，`alt + 回车`换行',
          maxRows: 16,
        }}
      />
      <div className="my-2 flex flex-row-reverse items-center">
        <Button
          isDisabled={props.inputStatus !== 'ALLOW_INPUT'}
          color="primary"
          onPress={execute}
          className="ml-3"
          isLoading={loading && props.inputStatus === 'ALLOW_INPUT'}
        >
          执行
        </Button>
        <Tooltip content="中断当前的前台任务(例如 watch 等命令)">
          <Button
            onPress={interrupt}
            variant="flat"
            color="danger"
            isLoading={loading && props.inputStatus === 'ALLOW_INTERRUPT'}
            isDisabled={props.inputStatus !== 'ALLOW_INTERRUPT'}
          >
            中断前台任务
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export default CommandExecuteBlock
