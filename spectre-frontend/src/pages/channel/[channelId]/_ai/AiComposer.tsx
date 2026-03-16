import React, { type KeyboardEvent, useState } from 'react'
import { Button, Switch, Textarea, Tooltip } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateConfig } from '@/store/configSlice.ts'

interface AiComposerProps {
  disabled?: boolean
  onSubmit: (query: string) => Promise<void>
}

const AiComposer: React.FC<AiComposerProps> = ({ disabled, onSubmit }) => {
  const [value, setValue] = useState('')
  const dispatch = useDispatch()
  const useSkills = useSelector<RootState, boolean | undefined>(
    (state) => state.config.useAiSkills,
  )

  const setUseSkills = (b: boolean) => {
    dispatch(
      updateConfig({
        useAiSkills: b,
      }),
    )
  }

  const submit = async () => {
    const query = value.trim()
    if (!query || disabled) {
      return
    }
    await onSubmit(query)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') {
      return
    }
    if (e.altKey) {
      setValue((value) => value + '\n')
      return
    }
    submit().then()
  }

  return (
    <div className="border-t-divider border-t p-3">
      <Textarea
        onKeyDown={onKeyDown}
        value={value}
        disableAutosize
        isDisabled={disabled}
        onValueChange={setValue}
        placeholder="向 AI 描述你的问题。使用 Enter 发送，Alt + Enter 换行"
      />
      <div className="mt-2 flex justify-between">
        <div className="flex items-center">
          <Switch isSelected={useSkills} onValueChange={setUseSkills} size="sm">
            启用 Skills(Beta)
          </Switch>
          <Tooltip
            classNames={{ content: 'max-w-48 break-all' }}
            content="启动 Skills 以解决更流程性的问题，例如 `帮我排查一下 CPU 占用高的问题`、`帮我获取一下 ApplicationContext`等。"
          >
            <SvgIcon
              icon={Icon.QUESTION}
              className="text-default-600 ml-1"
              size={16}
            />
          </Tooltip>
        </div>
        <Button
          color="primary"
          isDisabled={disabled || !value.trim()}
          onPress={submit}
        >
          发送
        </Button>
      </div>
    </div>
  )
}

export default AiComposer
