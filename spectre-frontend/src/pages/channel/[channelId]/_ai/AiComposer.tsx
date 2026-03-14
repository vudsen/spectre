import React, { type KeyboardEvent, useState } from 'react'
import { Button, Textarea } from '@heroui/react'

interface AiComposerProps {
  disabled?: boolean
  onSubmit: (query: string) => Promise<void>
}

const AiComposer: React.FC<AiComposerProps> = ({ disabled, onSubmit }) => {
  const [value, setValue] = useState('')

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
      <div className="mt-2 flex justify-end">
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
