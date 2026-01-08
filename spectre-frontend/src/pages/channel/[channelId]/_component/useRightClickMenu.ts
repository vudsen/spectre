import { type MouseEventHandler, useCallback, useEffect, useState } from 'react'
import type { RightClickMenuProps } from '@/pages/channel/[channelId]/_component/RightClickMenu.tsx'

type Pos = Omit<RightClickMenuProps, 'children'>
type Return = {
  onContextMenu: MouseEventHandler<unknown>
  menuProps: Pos
}

const initState: Pos = {
  x: 0,
  y: 0,
  show: false,
  onClose() {},
}

const useRightClickMenu = (): Return => {
  const [menuProps, setMenuProps] = useState<Pos>(initState)
  const onContextMenu: MouseEventHandler<unknown> = useCallback((e) => {
    e.preventDefault()
    setMenuProps((prevState) => ({ ...prevState, show: false }))
    requestAnimationFrame(() => {
      setMenuProps({
        x: e.pageX,
        y: e.pageY,
        show: true,
        onClose() {
          setMenuProps((prevState) => ({ ...prevState, show: false }))
        },
      })
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = () =>
      setMenuProps((prevState) => ({ ...prevState, show: false }))
    if (menuProps.show) {
      window.addEventListener('click', handleClickOutside)
    }
    return () => window.removeEventListener('click', handleClickOutside)
  }, [menuProps.show])

  return {
    onContextMenu,
    menuProps,
  }
}

export default useRightClickMenu
