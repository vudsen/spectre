import React, {
  type MouseEvent,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import RightClickMenu from '@/components/RightClickMenu/RightClickMenu.tsx'
import { ListboxItem } from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import useRightClickMenu from '@/components/RightClickMenu/useRightClickMenu.ts'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import PackageHider from '@/pages/channel/[channelId]/_message_view/_component/_common/PackageHider.tsx'

export type Trace = {
  fileName: string
  lineNumber: number
  className: string
  methodName: string
}

interface StackTraceProps {
  traces: Trace[]
  onDirty?: () => void
}

const Actions = {
  WATCH: 'watch',
  TRACE: 'trace',
  STACK: 'stack',
  FLAG: 'flag',
  JAD: 'jad',
} as const

const StackTrace: React.FC<StackTraceProps> = ({ traces, onDirty }) => {
  const { onContextMenu, menuProps } = useRightClickMenu()
  const [markedLines, setMarkedLines] = useState(new Set<number>())
  const selectedIndex = useRef(-1)
  const context = useContext(ChannelContext)

  const onContextMenu0 = useCallback(
    (e: MouseEvent<unknown>, index: number) => {
      selectedIndex.current = index
      onContextMenu(e)
    },
    [onContextMenu],
  )

  const changeFlag = useCallback(() => {
    setMarkedLines((prevState) => {
      const r = new Set(prevState)
      if (r.has(selectedIndex.current)) {
        r.delete(selectedIndex.current)
      } else {
        r.add(selectedIndex.current)
      }
      onDirty?.()
      return r
    })
  }, [onDirty])

  const onAction = useCallback(
    (key: string | number) => {
      const trace = traces[selectedIndex.current]
      if (
        context.getQuickCommandExecutor().handleActions(key, {
          classname: trace.className,
          methodName: trace.methodName,
        })
      ) {
        return
      }
      switch (key) {
        case Actions.JAD:
          context
            .getTabsController()
            .openTab('JAD', {}, { classname: trace.className })
          break
        case Actions.FLAG:
          changeFlag()
          break
      }
    },
    [changeFlag, context, traces],
  )

  return (
    <div>
      <div className="text-default-600 ml-4 flex w-auto flex-col text-sm">
        {traces.map((trace, index) => (
          <div className="my-0.5" key={index}>
            <span
              onContextMenu={(e) => onContextMenu0(e, index)}
              className={clsx(
                'cursor-pointer hover:opacity-80',
                markedLines.has(index) ? 'bg-yellow-200' : undefined,
              )}
            >
              <PackageHider
                classname={trace.className}
                forceExpand={markedLines.has(index)}
              />
              #<span className="text-default-500">{trace.methodName}</span>:
              <span className="text-default-400">{trace.lineNumber}</span>
            </span>
          </div>
        ))}
      </div>
      <RightClickMenu {...menuProps} onAction={onAction}>
        <ListboxItem key={Actions.JAD}>反编译</ListboxItem>
        <ListboxItem key={Actions.WATCH}>Watch</ListboxItem>
        <ListboxItem key={Actions.STACK}>Stack</ListboxItem>
        <ListboxItem key={Actions.TRACE}>Trace</ListboxItem>
        <ListboxItem
          key={Actions.FLAG}
          startContent={<SvgIcon icon={Icon.BOOKMARK} size={18} />}
        >
          {markedLines.has(selectedIndex.current) ? '取消标记' : '标记'}
        </ListboxItem>
      </RightClickMenu>
    </div>
  )
}

export default StackTrace
