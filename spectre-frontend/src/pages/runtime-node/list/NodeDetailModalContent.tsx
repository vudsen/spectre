import React from 'react'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react'

interface NodeDetailModalContentProps {
  entity?: {
    id: string
    name: string
    createdAt?: string
  }
  onClose: () => void
}
const NodeDetailModalContent: React.FC<NodeDetailModalContentProps> = ({
  entity,
  onClose,
}) => {
  if (!entity) {
    return null
  }
  return (
    <>
      <ModalHeader>{entity.name}</ModalHeader>
      <ModalBody>e</ModalBody>
      <ModalFooter>
        <Button color="primary" onPress={onClose}>
          关闭
        </Button>
      </ModalFooter>
    </>
  )
}

export default NodeDetailModalContent
