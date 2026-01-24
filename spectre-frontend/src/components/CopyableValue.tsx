import React, { useState } from 'react'
import type { TooltipProps } from '@heroui/react'
import { Tooltip } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'

interface CopyableValueProps {
  content: string
  placement?: TooltipProps['placement']
}
const CopyableValue: React.FC<CopyableValueProps> = ({
  content,
  placement,
}) => {
  const [isCopied, setCopied] = useState(false)
  let tooltip: React.ReactNode
  if (content.length > 256) {
    tooltip = (
      <span className="text-warning italic">{content.length} chars</span>
    )
  } else {
    tooltip = content
  }

  const doCopy = () => {
    if (isCopied) {
      return
    }
    setCopied(true)
    const clipboardItem = new ClipboardItem({
      'text/plain': content,
    })
    navigator.clipboard.write([clipboardItem]).finally(() => {
      setTimeout(() => {
        setCopied(false)
      }, 1000)
    })
  }

  return (
    <div className="flex items-center">
      <Tooltip
        content={tooltip}
        classNames={{ content: 'max-w-96 break-all' }}
        placement={placement}
      >
        <span className="max-w-64 truncate text-ellipsis">{content}</span>
      </Tooltip>
      <SvgIcon
        onClick={doCopy}
        icon={isCopied ? Icon.CHECK : Icon.COPY}
        className="text-primary-200 hover:text-primary-300 ml-1 cursor-pointer"
      />
    </div>
  )
}

export default CopyableValue
