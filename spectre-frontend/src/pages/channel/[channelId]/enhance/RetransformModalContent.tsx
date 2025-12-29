import UploadArea, {
  type UploadAreaRef,
} from '@/components/validation/UploadArea.tsx'
import { useRef, useState } from 'react'
import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface RetransformModalContentProps {
  onClose: () => void
}

const SUPPORTED_TYPES = ['.class']

const RetransformModalContent: React.FC<RetransformModalContentProps> = (
  props,
) => {
  const channelId = useSelector<RootState, string>(
    (state) => state.channel.context.channelId,
  )
  const { t } = useTranslation()
  const uploadRef = useRef<UploadAreaRef>(null)
  const [loading, setLoading] = useState(false)

  const onConfirm = () => {
    uploadRef.current!.upload()
    setLoading(true)
  }
  return (
    <>
      <ModalContent>
        <ModalHeader>Retransform</ModalHeader>
        <ModalBody>
          <div className="text-sm">
            上传 class 文件快速替换，文件会在使用完毕后立即删除。
          </div>
          <UploadArea
            onUploadFinished={() => setLoading(false)}
            onClose={props.onClose}
            sizeUnit="kb"
            supportedTypes={SUPPORTED_TYPES}
            url={`/arthas/channel/${channelId}/retransform`}
            ref={uploadRef}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={props.onClose}
            isDisabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button color="primary" onPress={onConfirm} isLoading={loading}>
            {t('common.upload')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </>
  )
}

export default RetransformModalContent
