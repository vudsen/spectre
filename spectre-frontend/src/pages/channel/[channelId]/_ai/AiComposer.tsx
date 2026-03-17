import React, { type KeyboardEvent, useState } from 'react'
import {
  Button,
  Modal,
  ModalContent,
  Textarea,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import SkillSelectModalContent from '@/pages/channel/[channelId]/_ai/SkillSelectModalContent.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateChannelContext } from '@/store/channelSlice.ts'
import type { SkillDTO } from '@/api/impl/ai.ts'

interface AiComposerProps {
  disabled?: boolean
  onSubmit: (query: string) => Promise<void>
}

const AiComposer: React.FC<AiComposerProps> = ({ disabled, onSubmit }) => {
  const [value, setValue] = useState('')
  const { onOpen, onOpenChange, isOpen } = useDisclosure()
  const dispatch = useDispatch()
  const selectedSkill = useSelector<RootState, SkillDTO | undefined>(
    (state) => state.channel.context.selectedSkill,
  )

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

  const clearSelectedSkill = () => {
    dispatch(
      updateChannelContext({
        selectedSkill: undefined,
      }),
    )
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
        <div className="group relative">
          <Button
            variant="light"
            onPress={onOpen}
            color={selectedSkill ? 'primary' : 'default'}
          >
            <SvgIcon icon={ChannelIcon.SKILL} />
            {selectedSkill ? selectedSkill.name : '技能'}
          </Button>
          {selectedSkill ? (
            <button
              type="button"
              className="bg-danger text-danger-foreground pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 scale-90 cursor-pointer items-center justify-center rounded-full text-xs leading-none opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                clearSelectedSkill()
              }}
              aria-label="取消技能选择"
            >
              ×
            </button>
          ) : null}
        </div>
        <Button
          color="primary"
          isDisabled={disabled || !value.trim()}
          onPress={submit}
        >
          发送
        </Button>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        isDismissable={false}
      >
        <ModalContent>
          {(onClose) => <SkillSelectModalContent onClose={onClose} />}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AiComposer
