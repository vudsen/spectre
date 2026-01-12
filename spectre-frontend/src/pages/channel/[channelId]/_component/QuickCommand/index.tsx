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
import React, { useState } from 'react'
import WatchCommandModalContent from '@/pages/channel/[channelId]/_component/QuickCommand/WatchCommandModalContent.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { createPortal } from 'react-dom'

interface QuickCommands {
  watch: {
    classname: string
  }
  trace: {
    classname: string
  }
  stack: {
    classname: string
  }
  jad: {
    classname: string
  }
}

const QuickCommand: React.FC = () => {
  const watchDisclosure = useDisclosure()
  const [isListOpen, setListOpen] = useState(false)
  const onAction = (key: string | number) => {
    console.log(key)
    switch (key) {
      case 'watch':
        watchDisclosure.onOpen()
        break
    }
    setListOpen(false)
  }
  return (
    <>
      <Popover isOpen={isListOpen} onOpenChange={(o) => setListOpen(o)}>
        <PopoverTrigger className="mr-5 text-sm">
          <div className="flex cursor-pointer items-center">
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
        isOpen={watchDisclosure.isOpen}
        onOpenChange={watchDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => <WatchCommandModalContent onClose={onClose} />}
        </ModalContent>
      </Modal>
    </>
  )
}

export default QuickCommand
