import { useDisclosure } from '@heroui/react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import React, { useImperativeHandle, useState } from 'react'
import { isPromise } from '@/common/util.ts'
import i18n from '@/i18n'

export type DialogConfig = {
  title: React.ReactNode
  message?: React.ReactNode
  confirmBtnText?: string
  cancelBtnText?: string
  onConfirm?: () => Promise<unknown> | void
  onCancel?: () => void
  color?: 'primary' | 'danger' | 'warning'
  hideCancel?: boolean
  isDismissable?: boolean
}

export interface ConfirmDialogRef {
  showDialog: (config: DialogConfig) => void
}

interface ConfirmDialogProps {
  ref: React.RefObject<ConfirmDialogRef | null>
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  const [config, setConfig] = useState<DialogConfig>({
    title: '',
    cancelBtnText: i18n.t('common.cancel'),
    confirmBtnText: i18n.t('common.confirm'),
  })
  const [isLoading, setLoading] = useState(false)
  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()

  const onConfirm = () => {
    const val = config.onConfirm?.()
    if (isPromise(val)) {
      setLoading(true)
      val.finally(() => {
        setLoading(false)
        onClose()
      })
    } else {
      onClose()
    }
  }

  useImperativeHandle(props.ref, () => ({
    showDialog(config) {
      setConfig({
        cancelBtnText: i18n.t('common.cancel'),
        confirmBtnText: i18n.t('common.confirm'),
        hideCancel: false,
        ...config,
      })
      onOpen()
    },
  }))

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={config.isDismissable}
      hideCloseButton={!config.isDismissable}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div
                className={`text-lg font-bold text-${/*I know this is an incorrect usage, but it works well.*/ config.color}`}
              >
                {config.title}
              </div>
            </ModalHeader>
            <ModalBody>{config.message}</ModalBody>
            <ModalFooter>
              {config.hideCancel ? null : (
                <Button
                  variant="light"
                  color="danger"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  {config.cancelBtnText}
                </Button>
              )}
              <Button
                variant="solid"
                color={config.color}
                onPress={onConfirm}
                isLoading={isLoading}
              >
                {config.confirmBtnText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default ConfirmDialog
