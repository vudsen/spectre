import React, { useCallback, useContext } from 'react'
import {
  Button,
  Modal,
  ModalContent,
  Tooltip,
  useDisclosure,
} from '@heroui/react'
import RetransformModalContent from './_enhance/RetransformModalContent.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'

interface MenuListProps {
  isExpand?: boolean
}

type MenuItem = {
  name: string
  icon: string
  type: string
}

const menuItems: MenuItem[] = [
  {
    name: 'Retransform',
    icon: ChannelIcon.HOT_SWAP,
    type: 'retransform',
  },
  {
    name: 'Profiler',
    icon: ChannelIcon.GAUGE,
    type: 'profiler',
  },
  {
    name: 'Dashboard',
    icon: ChannelIcon.DASHBOARD,
    type: 'dashboard',
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
            <SvgIcon icon={item.icon} />
          </Button>
        </Tooltip>
      ))}
    </>
  )
}

const COLLAPSED_WIDTH = 54
const Toolbar: React.FC<MenuListProps> = () => {
  const retransformDisclosure = useDisclosure()
  const context = useContext(ChannelContext)

  const onAction = useCallback(
    (item: MenuItem) => {
      switch (item.type) {
        case 'retransform': {
          retransformDisclosure.onOpen()
          break
        }
        case 'dashboard': {
          context.messageBus.execute('dashboard', true)
          context.getTabsController().openTab('DASHBOARD', {})
          break
        }
        case 'profiler': {
          context.getTabsController().openTab('PROFILER', {})
          break
        }
      }
    },
    [context, retransformDisclosure],
  )

  return (
    <>
      <div
        className="z-20 h-screen"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,.1)',
          width: COLLAPSED_WIDTH,
        }}
      >
        <div className="border-r-divider flex h-full flex-col items-center space-y-3 overflow-hidden px-2 shadow">
          <div className="mt-3">
            <Tooltip content="增强功能" placement="right">
              ✨
            </Tooltip>
          </div>
          <div className="flex flex-col items-center">
            <CollapsedMenuContent onAction={onAction} />
          </div>
        </div>
      </div>
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

export default Toolbar
