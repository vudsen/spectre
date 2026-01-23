import React, {
  useState,
  type KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
} from 'react'
import ControlledTextarea from '@/components/validation/ControlledTextarea.tsx'
import { addToast, Button, Tooltip } from '@heroui/react'
import { useForm } from 'react-hook-form'
import {
  type InputStatusResponse,
  interruptCommand,
} from '@/api/impl/arthas.ts'
import { type RootState, store } from '@/store'
import { useSelector } from 'react-redux'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'

type FromState = {
  command: string
}

const CommandExecuteBlock: React.FC = () => {
  const inputStatus = useSelector<
    RootState,
    InputStatusResponse['inputStatus']
  >((state) => state.channel.context.inputStatus)
  const isDebugMode = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.isDebugMode,
  )
  const [runningCommand, setRunningCommand] = useState<string | undefined>()

  const { control, trigger, getValues, reset, setValue } = useForm<FromState>()
  const [loading, setLoading] = useState(false)
  const context = useContext(ChannelContext)

  const execute = useCallback(async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    setLoading(true)
    try {
      await context.messageBus.execute(values.command)
      reset({ command: '' })
    } finally {
      setLoading(false)
    }
  }, [context.messageBus, getValues, reset, trigger])

  const interrupt = useCallback(() => {
    setLoading(true)
    return interruptCommand(store.getState().channel.context.channelId)
      .then(() => {
        addToast({
          title: '中断前台任务成功',
          color: 'success',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

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

  useEffect(() => {
    const id = context.messageBus.addListener({
      afterExecute(command, fail) {
        if (fail) {
          setValue('command', command)
        }
        setRunningCommand(command)
      },
    })
    return () => {
      context.messageBus.removeListener(id)
    }
  }, [context.messageBus, setValue])

  return (
    <div className="border-t-divider box-border flex h-48 flex-col border-t p-3">
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
      <div className="my-2 flex items-center justify-between">
        <div className="text-sm">
          <span>任务状态:&nbsp;</span>
          {inputStatus === 'ALLOW_INPUT' ? (
            <span className="text-success">空闲</span>
          ) : undefined}
          {inputStatus === 'ALLOW_INTERRUPT' ? (
            <span className="text-warning">{runningCommand}</span>
          ) : undefined}
        </div>
        <div>
          <Button
            isDisabled={inputStatus !== 'ALLOW_INPUT'}
            color="primary"
            onPress={execute}
            className="ml-3"
            isLoading={loading && inputStatus === 'ALLOW_INPUT'}
          >
            执行
          </Button>
          <Tooltip content="中断当前的前台任务(例如 watch 等命令)">
            <Button
              onPress={interrupt}
              variant="flat"
              className="ml-2"
              color="danger"
              isLoading={
                !isDebugMode && loading && inputStatus === 'ALLOW_INTERRUPT'
              }
              isDisabled={!isDebugMode && inputStatus !== 'ALLOW_INTERRUPT'}
            >
              中断前台任务
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default CommandExecuteBlock
