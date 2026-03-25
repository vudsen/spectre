import React, { useRef, useState } from 'react'
import {
  Button,
  Link,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import i18n from '@/i18n'
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
      <ModalHeader>
        {i18n.t('common.upload')} {props.type}
      </ModalHeader>
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
            {i18n.t(
              'hardcoded.msg_pages_toolchain_items_uploadtoolchainmodalcontent_001',
            )}
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
            {i18n.t('common.cancel')}
          </Button>
          <Button color="primary" onPress={doUpload} isLoading={uploading}>
            {i18n.t('common.upload')}
          </Button>
        </div>
      </ModalFooter>
    </>
  )
}

export default UploadToolchainModalContent
