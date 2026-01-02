import React, { useCallback, useImperativeHandle, useState } from 'react'
import axios from 'axios'
import { addToast, Button, Progress, Tooltip } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

interface UploadAreaProps {
  url: string
  onClose: () => void
  /**
   * 支持的文件类型，例如 `.png`
   */
  supportedTypes?: string[]
  ref: React.RefObject<UploadAreaRef | null>
  onUploadFinished?: () => void
  /**
   * 显示的单位大小，默认为 mb
   */
  sizeUnit?: keyof typeof SIZE_UNITS
}

const SIZE_UNITS = {
  kb: 1024,
  mb: 1024 * 1024,
} as const

export interface UploadAreaRef {
  upload(): Promise<void>
}

type UploadStatus = {
  progress: number
  total: string
  uploaded: string
}

const UploadArea: React.FC<UploadAreaProps> = (props) => {
  const [fileStatus, setFileStatus] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null)
  const onRemove = useCallback(() => {
    setFileStatus(null)
  }, [])

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const files = e.target.files
      if (!files) {
        return
      }
      setFileStatus(files[0])
    },
    [],
  )

  const unit = props.sizeUnit ?? 'mb'

  const doUpload = async (): Promise<void> => {
    const file = fileStatus
    if (!file) {
      addToast({
        title: '请选择文件',
        color: 'danger',
      })
      return
    }
    const rate = SIZE_UNITS[unit]
    setUploadStatus({
      progress: 0,
      total: (file.size / rate).toFixed(2),
      uploaded: '0',
    })
    const formData = new FormData()
    formData.append('file', fileStatus!)
    await axios.post(props.url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const totalLength = progressEvent.total
        const loaded = progressEvent.loaded

        if (totalLength) {
          const percentCompleted = Math.round((loaded * 100) / totalLength)

          setUploadStatus({
            progress: percentCompleted,
            total: (totalLength / rate).toFixed(2),
            uploaded: (progressEvent.loaded / rate).toFixed(2),
          })
        }
      },
    })
    addToast({
      title: '上传成功',
      color: 'success',
    })
    props.onClose()
  }

  useImperativeHandle(props.ref, () => ({
    upload: doUpload,
  }))

  const accept = props.supportedTypes
    ? props.supportedTypes.join(',')
    : undefined

  return (
    <div className="relative w-full max-w-lg">
      {fileStatus ? (
        <div>
          <div className="flex items-center">
            <Tooltip content={fileStatus.name}>
              <span className="truncate">{fileStatus.name}</span>
            </Tooltip>
            <Button
              isIconOnly
              color="danger"
              variant="light"
              onPress={onRemove}
              isDisabled={!!uploadStatus}
            >
              <SvgIcon icon={Icon.TRASH} />
            </Button>
          </div>
          {uploadStatus ? (
            <Progress
              aria-label="上传中..."
              className="max-w-md"
              color="success"
              label={`上传中 (${uploadStatus.uploaded}${unit.toUpperCase()}/${uploadStatus.total}${unit.toUpperCase()})`}
              showValueLabel={true}
              size="md"
              value={uploadStatus.progress}
            />
          ) : null}
        </div>
      ) : (
        <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition duration-300 ease-in-out hover:border-blue-500 hover:bg-blue-50">
          <input
            accept={accept}
            type="file"
            onChange={onChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width={40}
              height={40}
              className="text-gray-400"
            >
              <path
                fill="currentColor"
                d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"
              />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">点击上传</span>{' '}
              或拖放文件到此区域
            </p>
            <p className="text-xs text-gray-400">
              支持文件类型: {accept ?? '不限'} (最大 20MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadArea
