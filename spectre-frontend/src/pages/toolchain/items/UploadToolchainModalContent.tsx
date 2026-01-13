import React, { useRef, useState } from 'react'
import {
  Button,
  Link,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import UploadArea, {
  type UploadAreaRef,
} from '@/components/validation/UploadArea.tsx'

interface UploadToolchainModalContentProps {
  type: string
  tag: string
  isArm: boolean
  downloadUrl: string
  onClose: () => void
  onModified: () => void
}

const SUPPORTED_TYPES = ['.zip', '.tar.gz', '.tgz']

const UploadToolchainModalContent: React.FC<
  UploadToolchainModalContentProps
> = (props) => {
  const uploadRef = useRef<UploadAreaRef>(null)
  const [uploading, setUploading] = useState(false)

  const doUpload = () => {
    setUploading(true)
    uploadRef.current!.upload().finally(() => {
      setUploading(false)
    })
  }

  return (
    <>
      <ModalHeader>上传 {props.type}</ModalHeader>
      <ModalBody>
        <div className="relative w-full max-w-lg">
          <UploadArea
            supportedTypes={SUPPORTED_TYPES}
            url={`toolchain/upload?type=${props.type}&tag=${props.tag}&isArm=${props.isArm}`}
            onClose={props.onClose}
            ref={uploadRef}
          />
          <Link
            size="sm"
            isExternal
            showAnchorIcon
            underline="focus"
            href={props.downloadUrl}
            className="cursor-pointer"
          >
            点击此处下载对应工具包
          </Link>
        </div>
      </ModalBody>
      <ModalFooter>
        <div>
          <Button
            color="danger"
            variant="light"
            isDisabled={uploading}
            onPress={props.onClose}
          >
            取消
          </Button>
          <Button color="primary" onPress={doUpload} isLoading={uploading}>
            上传
          </Button>
        </div>
      </ModalFooter>
    </>
  )
}

export default UploadToolchainModalContent
