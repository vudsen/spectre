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

export type DialogConfig = {
  title: React.ReactNode
  message?: React.ReactNode
  confirmBtnText?: string
  cancelBtnText?: string
  onConfirm?: () => Promise<unknown> | void
  onCancel?: () => void
  color?: 'primary' | 'danger'
  hideCancel?: boolean
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
    cancelBtnText: '取消',
    confirmBtnText: '确认',
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
        cancelBtnText: '取消',
        confirmBtnText: '确认',
        hideCancel: false,
        ...config,
      })
      onOpen()
    },
  }))

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div
                className={`text-lg font-bold ${config.color === 'danger' ? 'text-danger' : 'text-primary'}`}
              >
                {config.title}
              </div>
            </ModalHeader>
            <ModalBody>{config.message}</ModalBody>
            <ModalFooter>
              {config.hideCancel ? null : (
                <Button
                  variant="light"
                  color="primary"
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
