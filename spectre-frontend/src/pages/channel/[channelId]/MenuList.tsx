import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Modal,
  ModalContent,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { setEnhanceMenuOpen } from '@/store/channelSlice.ts'
import { useDispatch } from 'react-redux'
import { store } from '@/store'
import RetransformModalContent from '@/pages/channel/[channelId]/enhance/RetransformModalContent.tsx'

interface MenuListProps {
  isExpand?: boolean
}

const RetransformIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      width={20}
      height={20}
    >
      {/*<!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->*/}
      <path
        fill="currentColor"
        d="M192 112L304 112L304 200C304 239.8 336.2 272 376 272L464 272L464 512C464 520.8 456.8 528 448 528L192 528C183.2 528 176 520.8 176 512L176 128C176 119.2 183.2 112 192 112zM352 131.9L444.1 224L376 224C362.7 224 352 213.3 352 200L352 131.9zM192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 250.5C512 233.5 505.3 217.2 493.3 205.2L370.7 82.7C358.7 70.7 342.5 64 325.5 64L192 64zM298.2 359.6C306.8 349.5 305.7 334.4 295.6 325.8C285.5 317.2 270.4 318.3 261.8 328.4L213.8 384.4C206.1 393.4 206.1 406.6 213.8 415.6L261.8 471.6C270.4 481.7 285.6 482.8 295.6 474.2C305.6 465.6 306.8 450.4 298.2 440.4L263.6 400L298.2 359.6zM378.2 328.4C369.6 318.3 354.4 317.2 344.4 325.8C334.4 334.4 333.2 349.6 341.8 359.6L376.4 400L341.8 440.4C333.2 450.5 334.3 465.6 344.4 474.2C354.5 482.8 369.6 481.7 378.2 471.6L426.2 415.6C433.9 406.6 433.9 393.4 426.2 384.4L378.2 328.4z"
      />
    </svg>
  )
}

type MenuItem = {
  name: string
  icon: React.ReactNode
  type: string
}

const menuItems: MenuItem[] = [
  {
    name: 'Retransform',
    icon: <RetransformIcon />,
    type: 'retransform',
  },
]

interface MenuContentProps {
  onAction: (item: MenuItem) => void
}

const CollapsedMenuContent: React.FC<MenuContentProps> = (props) => {
  return (
    <>
      {menuItems.map((item) => (
        <Tooltip key={item.type} content={item.name} placement="right">
          <Button
            variant="light"
            isIconOnly
            onPress={() => props.onAction(item)}
          >
            {item.icon}
          </Button>
        </Tooltip>
      ))}
    </>
  )
}

const ExpandedMenuContent: React.FC<MenuContentProps> = (props) => {
  return (
    <>
      {menuItems.map((item) => (
        <Button
          variant="light"
          key={item.type}
          onPress={() => props.onAction(item)}
        >
          {item.icon}
          {item.name}
        </Button>
      ))}
    </>
  )
}
const COLLAPSED_WIDTH = 54
const MenuList: React.FC<MenuListProps> = () => {
  const [isOpen, setOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const menuWidth = useRef(0)
  const dispatch = useDispatch()
  const retransformDisclosure = useDisclosure()

  const switchOpen = useCallback(() => {
    dispatch(setEnhanceMenuOpen(!isOpen))
    setOpen(!isOpen)
  }, [dispatch, isOpen])

  useEffect(() => {
    menuWidth.current = ref.current!.clientWidth
    setOpen(store.getState().channel.isMenuOpen)
  }, [])

  const onAction = useCallback(
    (item: MenuItem) => {
      switch (item.type) {
        case 'retransform': {
          retransformDisclosure.onOpen()
          break
        }
      }
    },
    [retransformDisclosure],
  )

  return (
    <>
      <motion.aside
        ref={ref}
        initial={false}
        className="z-20 h-screen"
        animate={{
          width: isOpen
            ? menuWidth.current === 0
              ? 'auto'
              : menuWidth.current
            : COLLAPSED_WIDTH,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,.1)',
        }}
      >
        <div className="border-r-divider flex h-full flex-col items-center space-y-3 overflow-hidden px-2 shadow">
          <div
            className={clsx(
              'mt-3 flex items-center justify-between',
              isOpen ? 'w-full' : undefined,
            )}
          >
            <div
              className={clsx('font-bold text-nowrap', isOpen ? '' : 'hidden')}
            >
              <span className="ml-2">✨增强功能</span>
            </div>
            <Button isIconOnly variant="light" size="sm" onPress={switchOpen}>
              <SvgIcon
                icon={Icon.RIGHT_ARROW}
                className={isOpen ? 'rotate-180' : ''}
              />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            {isOpen ? (
              <ExpandedMenuContent onAction={onAction} />
            ) : (
              <CollapsedMenuContent onAction={onAction} />
            )}
          </div>
        </div>
      </motion.aside>
      <Modal
        isOpen={retransformDisclosure.isOpen}
        onOpenChange={retransformDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => <RetransformModalContent onClose={onClose} />}
        </ModalContent>
      </Modal>
    </>
  )
}

export default MenuList
