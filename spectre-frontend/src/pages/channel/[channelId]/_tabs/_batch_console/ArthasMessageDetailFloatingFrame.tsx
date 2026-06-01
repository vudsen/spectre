import React, { useCallback, useState } from 'react'
import clsx from 'clsx'
import { Rnd } from 'react-rnd'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import ArthasResponseDetailTab from '@/pages/channel/[channelId]/_tabs/_console/ArthasResponseDetailTab.tsx'
import { Button } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { createPortal } from 'react-dom'

export interface ArthasMessageDetailFloatingFrameProps {
  entity?: ArthasMessage
  isMobile?: boolean
  className?: string
  onClose: () => void
}

const minVisibleSize = 48

function reboundWhenFullyOutside(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const isFullyOutsideX = x + width <= 0 || x >= viewportWidth
  const isFullyOutsideY = y + height <= 0 || y >= viewportHeight

  if (!isFullyOutsideX && !isFullyOutsideY) {
    return { x, y }
  }

  const minX = -width + minVisibleSize
  const maxX = viewportWidth - minVisibleSize
  const minY = -height + minVisibleSize
  const maxY = viewportHeight - minVisibleSize

  return {
    x: isFullyOutsideX ? Math.min(Math.max(x, minX), maxX) : x,
    y: isFullyOutsideY ? Math.min(Math.max(y, minY), maxY) : y,
  }
}

const ArthasMessageDetailFloatingFrame: React.FC<
  ArthasMessageDetailFloatingFrameProps
> = ({ entity, isMobile = false, className, onClose }) => {
  const [layout, setLayout] = useState({
    x: 80,
    y: 80,
    width: 760,
    height: 520,
  })

  const handleRebound = useCallback(
    (nextX: number, nextY: number, width: number, height: number) => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const rebound = reboundWhenFullyOutside(
        nextX,
        nextY,
        width,
        height,
        viewportWidth,
        viewportHeight,
      )
      setLayout({ x: rebound.x, y: rebound.y, width, height })
    },
    [],
  )

  if (!entity) {
    return null
  }

  return createPortal(
    <Rnd
      disableDragging={isMobile}
      enableResizing={!isMobile}
      minWidth={480}
      minHeight={300}
      maxWidth="90vw"
      maxHeight="85vh"
      size={{ width: layout.width, height: layout.height }}
      position={{ x: layout.x, y: layout.y }}
      onDragStop={(_e, data) => {
        handleRebound(data.x, data.y, layout.width, layout.height)
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        handleRebound(
          position.x,
          position.y,
          parseInt(ref.style.width, 10),
          parseInt(ref.style.height, 10),
        )
      }}
      className={clsx(
        'z-50 overflow-hidden rounded-xl border shadow-lg',
        'bg-content1 border-default-200',
        isMobile ? 'rounded-none border-0 shadow-none' : '',
        className,
      )}
      style={{ position: 'fixed' }}
    >
      <ArthasResponseDetailTab
        entity={entity}
        onOpenExternal={onClose}
        rightContent={
          <Button
            onPress={onClose}
            isIconOnly
            variant="light"
            size="sm"
            className="ml-2"
            color="danger"
          >
            <SvgIcon icon={Icon.CLOSE} />
          </Button>
        }
      />
    </Rnd>,
    document.body,
  )
}

export default ArthasMessageDetailFloatingFrame
