import {
  Listbox,
  ListboxItem,
  Modal,
  ModalContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from '@heroui/react'
import React, { useImperativeHandle, useState } from 'react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import CommandFormContent, { type FormHandle } from './CommandFormContent'
import {
  quickCommandHandles,
  type QuickCommandKeys,
} from '@/pages/channel/[channelId]/_component/QuickCommand/commands.ts'

interface QuickCommands {
  watch: {
    classname: string
    methodName: string
  }
  trace: {
    classname: string
    methodName: string
  }
  stack: {
    classname: string
    methodName: string
  }
  jad: {
    classname: string
  }
  tt: {
    index: number
  }
}

type OpenArgs<K extends keyof QuickCommands> =
  QuickCommands[K] extends undefined ? [K] : [K, QuickCommands[K]]

type OpenFunc = <K extends keyof QuickCommands>(...args: OpenArgs<K>) => void

type HandleActionArgs = {
  classname: string
  methodName: string
}
/**
 * 处理右键动作
 * @return 返回 true 表示事件已经被处理
 */
type HandleActionsFunc = (
  actionKey: string | number,
  args: HandleActionArgs,
) => boolean

export interface QuickCommandRef {
  open: OpenFunc
  handleActions: HandleActionsFunc
}

interface QuickCommandProps {
  ref: React.RefObject<QuickCommandRef | null>
}

type MyFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle: FormHandle<any>
  defaultValues: object
}

const QuickCommand: React.FC<QuickCommandProps> = (props) => {
  const modalDisclosure = useDisclosure()
  const [modalProps, setModalProps] = useState<MyFormProps | undefined>(
    undefined,
  )
  const [isListOpen, setListOpen] = useState(false)
  const onAction0 = (key: string | number, args: object = {}): boolean => {
    const qck = key as QuickCommandKeys
    const handle = quickCommandHandles[qck]
    console.log('1')
    if (!handle) {
      return false
    }
    setModalProps({
      handle,
      defaultValues: args,
    })
    modalDisclosure.onOpen()
    setListOpen(false)
    return true
  }

  useImperativeHandle(props.ref, () => ({
    open(...args) {
      onAction0(args[0], args[1])
    },
    handleActions(key: string | number, args) {
      return onAction0(key, args)
    },
  }))

  const onAction = (key: string | number) => {
    onAction0(key)
  }
  return (
    <>
      <Popover isOpen={isListOpen} onOpenChange={(o) => setListOpen(o)}>
        <PopoverTrigger className="mr-5 text-sm">
          <div className="text-primary flex cursor-pointer items-center">
            <div>🪄快捷指令</div>
            <SvgIcon icon={Icon.RIGHT_ARROW} className="rotate-90" />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Listbox
            classNames={{ list: 'min-w-32' }}
            onAction={onAction}
            aria-label="Quick Actions"
          >
            <ListboxItem key="watch">Watch</ListboxItem>
            <ListboxItem key="trace">Trace</ListboxItem>
            <ListboxItem key="stack">Stack</ListboxItem>
            <ListboxItem key="jad">反编译</ListboxItem>
          </Listbox>
        </PopoverContent>
      </Popover>
      <Modal
        size="2xl"
        isOpen={modalDisclosure.isOpen}
        onOpenChange={modalDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <CommandFormContent {...modalProps!} onClose={onClose} />
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export default QuickCommand
