import type React from 'react'
import { Spinner } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import i18n from '@/i18n'

const TableLoadingMask: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="loadingMask"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-primary z-20 mt-[100px] box-border flex h-full w-full flex-col items-center justify-center space-y-3 bg-white text-sm"
      >
        <Spinner variant="wave" size="sm" />
        <div>{i18n.t('hardcoded.msg_components_tableloadingmask_001')}</div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TableLoadingMask
