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
import i18n from '@/i18n'

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
          title: i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_001',
          ),
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
        setRunningCommand(command.trim())
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
          placeholder: i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_002',
          ),
          maxRows: 16,
        }}
      />
      <div className="my-2 flex items-center justify-between">
        <div className="text-sm">
          <span>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_003',
            )}
            &nbsp;
          </span>
          {inputStatus === 'ALLOW_INPUT' ? (
            <span className="text-success">
              {i18n.t(
                'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_004',
              )}
            </span>
          ) : undefined}
          {inputStatus === 'ALLOW_INTERRUPT' ? (
            <span className="text-warning">{runningCommand}</span>
          ) : undefined}
        </div>
        <div className="flex items-center">
          <Button
            isDisabled={inputStatus !== 'ALLOW_INPUT'}
            color="primary"
            onPress={execute}
            className="ml-3"
            isLoading={loading && inputStatus === 'ALLOW_INPUT'}
          >
            {i18n.t(
              'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_005',
            )}
          </Button>
          <Tooltip
            content={i18n.t(
              'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_006',
            )}
          >
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
              {i18n.t(
                'hardcoded.msg_pages_channel_param_tabs_console_commandexecuteblock_007',
              )}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default CommandExecuteBlock
