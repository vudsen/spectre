import { motion, AnimatePresence } from 'framer-motion'
import { ListboxItem, type ListboxProps } from '@heroui/react'
import { Listbox } from '@heroui/react'
import React, { useCallback } from 'react'

export type RightClickMenuItem = {
  name: string
  key: string
  color?: ListboxProps['color']
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
}

export interface RightClickMenuProps {
  x: number
  y: number
  show: boolean
  /**
   * Please use `ListboxItem` as children
   * @deprecated use {@link RightClickMenuProps#items} instead.
   */
  children?: ListboxProps['children']
  items?: RightClickMenuItem[]
  onAction?: (key: string | number) => void
  onClose: () => void
}

interface RightClickMenuV2Props {
  x: number
  y: number
  show: boolean
  onAction?: (key: string | number) => void
  onClose: () => void
  items: RightClickMenuItem[]
}

const RightClickMenuV2: React.FC<RightClickMenuV2Props> = ({
  x,
  y,
  show,
  items,
  onAction,
  onClose,
}) => {
  const onAction0 = useCallback(
    (key: string | number) => {
      onAction?.(key)
      onClose()
    },
    [onAction, onClose],
  )
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-1000 min-w-40 rounded-lg bg-white py-2"
          style={{
            top: y,
            left: x,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Listbox aria-label="Actions" onAction={onAction0}>
            {items.map((item) => (
              <ListboxItem
                className={item.className}
                key={item.key}
                startContent={<div className="h-5 w-5">{item.icon}</div>}
                color={item.color}
                isDisabled={item.disabled}
              >
                {item.name}
              </ListboxItem>
            ))}
          </Listbox>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface RightClickMenuLegacyProps {
  x: number
  y: number
  show: boolean
  /**
   * Please use `ListboxItem` as children
   * @deprecated use {@link RightClickMenuProps#items} instead.
   */
  children: ListboxProps['children']
  onAction?: (key: string | number) => void
  onClose: () => void
}

const RightClickMenuLegacy: React.FC<RightClickMenuLegacyProps> = ({
  x,
  y,
  show,
  children,
  onAction,
  onClose,
}) => {
  const onAction0 = useCallback(
    (key: string | number) => {
      onAction?.(key)
      onClose()
    },
    [onAction, onClose],
  )
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-1000 min-w-40 rounded-lg bg-white py-2"
          style={{
            top: y,
            left: x,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Listbox
            aria-label="Actions"
            onAction={onAction0}
            classNames={{
              list:
                "[&>li:has(>span:first-child)]:before:content-['']" +
                ' [&>li:has(>span:first-child)]:before:inline-block' +
                ' [&>li:has(>span:first-child)]:before:w-5 ' +
                '[&>li>svg:first-child]:w-5',
            }}
            children={children}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
const RightClickMenu: React.FC<RightClickMenuProps> = (props) => {
  if (props.items) {
    return <RightClickMenuV2 {...props} items={props.items} />
  } else if (props.children) {
    return <RightClickMenuLegacy {...props} children={props.children} />
  } else {
    throw new Error('Neither children nor items was provided.')
  }
}

export default RightClickMenu
