import type { DetailComponentProps } from '../factory.ts'
import React, {
  type MouseEvent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import Time from '@/components/Time.tsx'
import RightClickMenu from '../../_component/RightClickMenu.tsx'
import useRightClickMenu from '../../_component/useRightClickMenu.ts'
import Icon from '@/components/icon/icon.ts'
import clsx from 'clsx'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { Button, ListboxItem, Tooltip } from '@heroui/react'
import { setTipRead } from '@/store/tipSlice'
import SvgIcon from '@/components/icon/SvgIcon.tsx'

type Trace = {
  fileName: string
  lineNumber: number
  className: string
  methodName: string
}

type StackMessage = {
  fid: number
  type: 'stack'
  threadId: number
  threadName: string
  ts: string
  classloader: string
  cost: number
  daemon: boolean
  jobId: number
  priority: number
  stackTrace: Trace[]
}

type KV = {
  name: string
  value: React.ReactNode
}

interface PackageHiderProps {
  trace: Trace
  forceExpand?: boolean
}

type ClassInfo = {
  package: string
  lightPackage: string
  classname: string
}

const PackageHider: React.FC<PackageHiderProps> = ({ trace, forceExpand }) => {
  const [lightMode, setLightMode] = useState(true)
  const info: ClassInfo = useMemo(() => {
    const packageCharacters: string[] = []
    const pkgs = trace.className.split('.')
    for (let i = 0; i < pkgs.length - 1; i++) {
      if (i === 1) {
        // usually company name
        packageCharacters.push(pkgs[i])
      } else {
        packageCharacters.push(pkgs[i].charAt(0))
      }
    }
    return {
      classname: pkgs[pkgs.length - 1],
      package: trace.className.substring(0, trace.className.lastIndexOf('.')),
      lightPackage: packageCharacters.join('.'),
    }
  }, [trace.className])

  return (
    <>
      {lightMode && !forceExpand ? (
        <span
          className="cursor-pointer bg-green-100"
          onClick={() => setLightMode(false)}
        >
          {info.lightPackage}
        </span>
      ) : (
        <span>{info.package}</span>
      )}
      <span>.{info.classname}</span>
    </>
  )
}

const Actions = {
  WATCH: 'watch',
  TRACE: 'trace',
  STACK: 'stack',
  FLAG: 'flag',
  JAD: 'jad',
} as const

const StackMessageDetail: React.FC<DetailComponentProps<StackMessage>> = ({
  msg,
  onDirty,
}) => {
  const [markedLines, setMarkedLines] = useState(new Set<number>())
  const selectedIndex = useRef(-1)
  const channelRightClickMenuTip = useSelector<RootState, boolean | undefined>(
    (state) => state.tip.channelRightClickMenuTip,
  )
  const dispatch = useDispatch()
  const context = useContext(ChannelContext)
  const keyValues: KV[] = useMemo(
    () => [
      {
        name: 'ID',
        value: msg.threadId,
      },
      {
        name: 'Time',
        value: <Time time={msg.ts} />,
      },
      {
        name: 'Daemon',
        value: msg.daemon.toString(),
      },
    ],
    [msg],
  )

  const { onContextMenu, menuProps } = useRightClickMenu()

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

  const hideRightClickTip = useCallback(() => {
    dispatch(
      setTipRead({
        channelRightClickMenuTip: true,
      }),
    )
  }, [dispatch])

  const onAction = useCallback(
    (key: string | number) => {
      const trace = msg.stackTrace[selectedIndex.current]
      switch (key) {
        case Actions.JAD:
          context.openTab(
            'JAD',
            { name: trace.fileName, uniqueId: `jad:${trace.fileName}` },
            { classname: trace.className },
          )
          break
        case Actions.WATCH:
          context.execute(`watch ${trace.className} ${trace.methodName} -x 2`)
          break
        case Actions.FLAG:
          changeFlag()
          break
        case Actions.TRACE:
          context.execute(`trace ${trace.className} ${trace.methodName}`)
          break
        case Actions.STACK:
          context.execute(`stack ${trace.className} ${trace.methodName} -x 2`)
          break
      }
    },
    [changeFlag, context, msg.stackTrace],
  )

  return (
    <div className="inline-block">
      <Tooltip
        content={
          <div className="flex flex-col">
            <div className="mt-2">
              Tip: 右键调用栈可以打开菜单。支持进行快速 watch 等操作
            </div>
            <Button
              className="mt-2 self-end"
              variant="light"
              color="primary"
              onPress={hideRightClickTip}
            >
              不再提醒
            </Button>
          </div>
        }
        isOpen={!channelRightClickMenuTip}
        showArrow
        placement="top-start"
      >
        <div>
          <span className="font-bold">{msg.threadName} (</span>
          {keyValues.map((kv, index) => (
            <span key={kv.name}>
              {index !== 0 ? <span>; </span> : null}
              <span>{kv.name}</span>
              <span> = </span>
              <span className="text-default-500">{kv.value}</span>
            </span>
          ))}
          <span>)</span>
        </div>
      </Tooltip>
      <div className="text-default-600 ml-4 flex w-auto flex-col text-sm">
        {msg.stackTrace.map((trace, index) => (
          <div className="my-0.5" key={index}>
            <span
              onContextMenu={(e) => onContextMenu0(e, index)}
              className={clsx(
                'cursor-pointer hover:opacity-80',
                markedLines.has(index) ? 'bg-yellow-200' : undefined,
              )}
            >
              <PackageHider
                trace={trace}
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

export default StackMessageDetail
