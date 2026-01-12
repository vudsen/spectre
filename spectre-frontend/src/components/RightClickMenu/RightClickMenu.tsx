import { motion, AnimatePresence } from 'framer-motion'
import type { ListboxProps } from '@heroui/react'
import { Listbox } from '@heroui/react'
import React, { useCallback } from 'react'

export interface RightClickMenuProps {
  x: number
  y: number
  show: boolean
  /**
   * Please use `ListboxItem` as children
   */
  children: ListboxProps['children']
  onAction?: (key: string | number) => void
  onClose: () => void
}

const RightClickMenu: React.FC<RightClickMenuProps> = ({
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
          className="absolute z-1000 min-w-40 rounded-lg bg-white py-2"
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

export default RightClickMenu
