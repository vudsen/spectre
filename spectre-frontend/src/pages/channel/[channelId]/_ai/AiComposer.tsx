import React, {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Button,
  Card,
  Checkbox,
  Listbox,
  ListboxItem,
  Modal,
  ModalContent,
  Spinner,
  Textarea,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import SkillSelectModalContent from '@/pages/channel/[channelId]/_ai/SkillSelectModalContent.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { updateChannelContext } from '@/store/channelSlice.ts'
import { listSkills, type SkillDTO } from '@/api/impl/ai.ts'
import i18n from '@/i18n'

interface AiComposerProps {
  disabled?: boolean
  skillSelectionDisabled?: boolean
  onSubmit: (query: string) => Promise<void>
}

const SKILL_PREFIX_REGEXP = /^\$\S+\s*/

function removeLeadingSkillPrefix(text: string): string {
  return text.replace(SKILL_PREFIX_REGEXP, '')
}

function withSkillPrefix(text: string, skillName: string): string {
  return `$${skillName} ${removeLeadingSkillPrefix(text)}`
}

function splitLeadingSkillToken(text: string) {
  const match = text.match(/^\$\S+/)
  if (!match) {
    return { token: '', rest: text }
  }
  return {
    token: match[0],
    rest: text.slice(match[0].length),
  }
}

type TriggerRange = {
  start: number
  end: number
}

function resolveSkillTrigger(text: string, caret: number) {
  const safeCaret = Math.max(0, Math.min(caret, text.length))
  const beforeCaret = text.slice(0, safeCaret)
  const triggerStart = beforeCaret.lastIndexOf('$')
  if (triggerStart < 0) {
    return undefined
  }
  const tokenBeforeCaret = text.slice(triggerStart, safeCaret)
  if (/\s/.test(tokenBeforeCaret)) {
    return undefined
  }
  let triggerEnd = safeCaret
  while (triggerEnd < text.length && !/\s/.test(text[triggerEnd])) {
    triggerEnd += 1
  }
  return {
    query: tokenBeforeCaret.slice(1),
    range: { start: triggerStart, end: triggerEnd } as TriggerRange,
  }
}

const AiComposer: React.FC<AiComposerProps> = ({
  disabled,
  skillSelectionDisabled,
  onSubmit,
}) => {
  const [value, setValue] = useState('')
  const [isSkillLoading, setIsSkillLoading] = useState(false)
  const [skillError, setSkillError] = useState<string | undefined>(undefined)
  const [skillMenuOpen, setSkillMenuOpen] = useState(false)
  const [skillQuery, setSkillQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [triggerRange, setTriggerRange] = useState<TriggerRange | undefined>(
    undefined,
  )
  const { onOpen, onOpenChange, isOpen } = useDisclosure()
  const dispatch = useDispatch()
  const selectedSkill = useSelector<RootState, SkillDTO | undefined>(
    (state) => state.channel.context.selectedSkill,
  )
  const availableSkills = useSelector<RootState, SkillDTO[] | undefined>(
    (state) => state.channel.context.availableSkills,
  )
  const autoConfirm = useSelector<RootState, boolean | undefined>(
    (state) => state.channel.context.autoConfirm,
  )
  const filteredSkills = useMemo(
    () =>
      (availableSkills ?? []).filter((skill) =>
        skill.name.toLowerCase().startsWith(skillQuery.toLowerCase()),
      ),
    [availableSkills, skillQuery],
  )

  useEffect(() => {
    if (!skillMenuOpen || availableSkills !== undefined || isSkillLoading) {
      return
    }
    setIsSkillLoading(true)
    setSkillError(undefined)
    listSkills()
      .then((data) => {
        dispatch(
          updateChannelContext({
            availableSkills: data || [],
          }),
        )
      })
      .catch((e: unknown) => {
        setSkillError(
          e instanceof Error
            ? e.message
            : i18n.t(
                'hardcoded.msg_pages_channel_param_ai_skillselectmodalcontent_001',
              ),
        )
      })
      .finally(() => {
        setIsSkillLoading(false)
      })
  }, [availableSkills, dispatch, isSkillLoading, skillMenuOpen])

  useEffect(() => {
    if (filteredSkills.length === 0) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((v) => Math.min(v, filteredSkills.length - 1))
  }, [filteredSkills.length])

  useEffect(() => {
    if (skillSelectionDisabled) {
      closeSkillMenu()
    }
  }, [skillSelectionDisabled])

  const submit = async () => {
    const query = value.trim()
    if (!query || disabled) {
      return
    }
    await onSubmit(query)
    setValue('')
  }

  const closeSkillMenu = () => {
    setSkillMenuOpen(false)
    setSkillQuery('')
    setTriggerRange(undefined)
    setActiveIndex(0)
  }

  const applySelectedSkill = (skill: SkillDTO, byTrigger = false) => {
    if (skillSelectionDisabled) {
      return
    }
    dispatch(
      updateChannelContext({
        selectedSkill: skill,
      }),
    )
    setValue((v) => {
      if (byTrigger && triggerRange) {
        return `${v.slice(0, triggerRange.start)}${v.slice(triggerRange.end)}`
      }
      return withSkillPrefix(v, skill.name)
    })
    closeSkillMenu()
  }

  const onManualSkillSelected = (skill: SkillDTO) => {
    if (skillSelectionDisabled) {
      return
    }
    setValue((v) => withSkillPrefix(v, skill.name))
    closeSkillMenu()
  }

  const syncSkillTrigger = (nextValue: string, caret: number) => {
    if (skillSelectionDisabled) {
      closeSkillMenu()
      return
    }
    const trigger = resolveSkillTrigger(nextValue, caret)
    if (!trigger) {
      closeSkillMenu()
      return
    }
    setSkillQuery(trigger.query)
    setTriggerRange(trigger.range)
    setSkillMenuOpen(true)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (skillMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (filteredSkills.length > 0) {
          setActiveIndex((v) => (v + 1) % filteredSkills.length)
        }
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (filteredSkills.length > 0) {
          setActiveIndex((v) =>
            v === 0 ? filteredSkills.length - 1 : Math.max(v - 1, 0),
          )
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSkillMenu()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const skill = filteredSkills[activeIndex]
        if (skill) {
          applySelectedSkill(skill, true)
        }
        return
      }
    }

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
    setValue((v) => removeLeadingSkillPrefix(v))
  }

  const onAutoConfirmChange = (v: boolean) => {
    dispatch(
      updateChannelContext({
        autoConfirm: v,
      }),
    )
  }
  const { token: leadingSkillToken, rest: leadingSkillRest } =
    splitLeadingSkillToken(value)
  const hasStyledSkillPrefix =
    !!selectedSkill && leadingSkillToken === `$${selectedSkill.name}`

  return (
    <div className="border-t-divider border-t p-3">
      <div className="relative">
        {skillMenuOpen ? (
          <Card className="absolute right-0 bottom-full left-0 z-20 mb-2 max-h-64 overflow-y-auto">
            {isSkillLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : null}
            {!isSkillLoading && skillError ? (
              <div className="text-danger px-3 py-2 text-sm">{skillError}</div>
            ) : null}
            {!isSkillLoading && !skillError ? (
              <Listbox
                aria-label="Skill Suggestion"
                onAction={(key) => {
                  const skill = filteredSkills.find((item) => item.id === key)
                  if (skill) {
                    applySelectedSkill(skill, true)
                  }
                }}
              >
                {filteredSkills.length > 0 ? (
                  filteredSkills.map((skill, index) => (
                    <ListboxItem
                      key={skill.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`data-[hover=true]:!bg-primary data-[hover=true]:!text-primary-foreground data-[focus=true]:!bg-primary data-[focus=true]:!text-primary-foreground ${
                        index === activeIndex
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }`}
                    >
                      <div className="text-sm font-medium">{skill.name}</div>
                      <div
                        className={
                          index === activeIndex
                            ? 'text-primary-foreground/80 text-xs'
                            : 'text-default-500 text-xs'
                        }
                      >
                        {skill.description}
                      </div>
                    </ListboxItem>
                  ))
                ) : (
                  <ListboxItem key="empty" isReadOnly>
                    <div className="text-default-500 text-sm">
                      {i18n.t(
                        'hardcoded.msg_pages_channel_param_ai_skillselectmodalcontent_004',
                      )}
                    </div>
                  </ListboxItem>
                )}
              </Listbox>
            ) : null}
          </Card>
        ) : null}
        {hasStyledSkillPrefix ? (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden px-3 py-2 text-sm whitespace-pre-wrap">
            <span className="bg-primary text-primary-foreground rounded px-1 py-0.5">
              {leadingSkillToken}
            </span>
            <span>{leadingSkillRest}</span>
          </div>
        ) : null}
        <Textarea
          onKeyDown={onKeyDown}
          value={value}
          disableAutosize
          isDisabled={disabled}
          classNames={
            hasStyledSkillPrefix
              ? {
                  input: 'text-transparent caret-foreground',
                }
              : undefined
          }
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const nextValue = e.target.value
            setValue(nextValue)
            syncSkillTrigger(
              nextValue,
              e.target.selectionStart ?? nextValue.length,
            )
          }}
          onClick={(e) => {
            const nextValue = e.currentTarget.value
            syncSkillTrigger(nextValue, e.currentTarget.selectionStart ?? 0)
          }}
          onKeyUp={(e) => {
            const nextValue = e.currentTarget.value
            syncSkillTrigger(nextValue, e.currentTarget.selectionStart ?? 0)
          }}
          placeholder={i18n.t(
            'hardcoded.msg_pages_channel_param_ai_aicomposer_001',
          )}
        />
      </div>
      <div className="mt-2 flex justify-between">
        <div className="group relative flex items-center">
          <Tooltip content={i18n.t('channel.autoConfirmDesc')}>
            <Checkbox
              size="sm"
              isSelected={autoConfirm}
              onValueChange={onAutoConfirmChange}
            >
              {i18n.t('channel.autoConfirm')}
            </Checkbox>
          </Tooltip>
          <div className="ml-2">
            <Button
              variant="light"
              onPress={() => {
                if (!skillSelectionDisabled) {
                  onOpen()
                }
              }}
              color={selectedSkill ? 'primary' : 'default'}
              isDisabled={skillSelectionDisabled}
            >
              <SvgIcon icon={ChannelIcon.SKILL} />
              {selectedSkill
                ? selectedSkill.name
                : i18n.t('hardcoded.msg_pages_channel_param_ai_aicomposer_002')}
            </Button>
            {selectedSkill && !skillSelectionDisabled ? (
              <button
                type="button"
                className="bg-danger text-danger-foreground pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 scale-90 cursor-pointer items-center justify-center rounded-full text-xs leading-none opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelectedSkill()
                }}
                aria-label={i18n.t(
                  'hardcoded.msg_pages_channel_param_ai_aicomposer_003',
                )}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
        <Button
          color="primary"
          isDisabled={disabled || !value.trim()}
          onPress={submit}
        >
          {i18n.t('hardcoded.msg_pages_channel_param_ai_aicomposer_004')}
        </Button>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        isDismissable={false}
      >
        <ModalContent>
          {(onClose) => (
            <SkillSelectModalContent
              onClose={onClose}
              onSkillSelected={onManualSkillSelected}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AiComposer
