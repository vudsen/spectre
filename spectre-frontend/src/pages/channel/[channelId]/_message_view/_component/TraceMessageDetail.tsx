import React, { useContext, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { formatTime } from '@/common/util.ts'
import { ListboxItem, Tooltip } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'
import RightClickMenu from '@/components/RightClickMenu/RightClickMenu.tsx'
import useRightClickMenu from '@/components/RightClickMenu/useRightClickMenu.ts'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
type Invoke = {
  className: string
  cost: number
  invoking: boolean
  lineNumber: number
  maxCost: number
  methodName: string
  minCost: number
  times: number
  totalCost: number
  type: 'method'
  children?: Invoke[]
}

type Root = {
  classloader: string
  daemon: false
  priority: number
  threadId: number
  threadName: string
  timestamp: string
  type: 'thread'
  children: Invoke[]
}

type TraceMessage = {
  type: 'trace'
  jobId: number
  nodeCount: number
  root: Root
  fid: number
}

function toKey(invoke: Invoke): string {
  return `${invoke.className}#${invoke.methodName}#${invoke.lineNumber}_${invoke.totalCost}`
}

interface TraceRowProps {
  invoke: Invoke
  className?: string
  level: number
  isTail: boolean
  isAbnormal?: boolean
  onMenuContext: (invoke: Invoke, e: React.MouseEvent<unknown>) => void
}

const GAP = 12
const unit = 1000 * 1000

const EMPTY_ARRAY: Invoke[] = [] as const

const TraceRow: React.FC<TraceRowProps> = ({
  invoke,
  className,
  level,
  isTail,
  isAbnormal,
  onMenuContext,
}) => {
  const childes = invoke.children ?? EMPTY_ARRAY
  const abnormalIndex = useMemo(() => {
    const pos = findAnomalyStartIndex(
      childes.map((ivk) => {
        if (ivk.cost) {
          return ivk.cost
        }
        return (ivk.minCost + ivk.maxCost) / 2
      }),
    )
    return pos === -1 ? Infinity : pos
  }, [childes])
  return (
    <div className={className} style={{ marginLeft: GAP * level }}>
      <div
        className="relative flex items-center py-1 hover:opacity-80"
        onContextMenu={(e) => onMenuContext(invoke, e)}
      >
        <span
          className={clsx(
            'bg-primary absolute top-0 left-0 w-0.5',
            isTail ? 'h-1/2' : 'h-full',
          )}
        />
        <div className="bg-primary mt-1 h-0.5 w-4"></div>
        <div className="ml-1 w-0">
          <span
            className={clsx(
              isAbnormal ? 'text-danger' : 'text-default-600',
              'cursor-pointer text-sm',
            )}
          >
            <span>
              [
              {invoke.cost
                ? `${(invoke.cost / unit).toFixed(4)}ms`
                : `min=${invoke.minCost}; max=${invoke.maxCost}`}
              ]&nbsp;
            </span>
            <span>
              {invoke.className}#{invoke.methodName}:{invoke.lineNumber}
            </span>
          </span>
        </div>
      </div>
      {childes.map((ivk, index) => (
        <TraceRow
          key={toKey(ivk)}
          onMenuContext={onMenuContext}
          level={level + 1}
          invoke={ivk}
          isTail={index === childes.length - 1}
          isAbnormal={index >= abnormalIndex}
        />
      ))}
    </div>
  )
}

/**
 * 提示词：我现在有一组从小到大排序的耗时数据，通常我们希望这些耗时数据都是相近的，我需要你帮我用 typescript 写一个算法，给出一个索引，表示该索引对应的耗时以及后面的耗时都是不正常的
 *
 *
 * 寻找耗时数据中的异常起点索引
 * @param latencies 已从小到大排序的耗时数组 (ms)
 * @param sensitivity 灵敏度，默认 3.5（越小越容易判定为异常）
 * @returns 异常开始的索引。如果没有异常，返回 -1。
 */
function findAnomalyStartIndex(
  latencies: number[],
  sensitivity: number = 3.5,
): number {
  if (latencies.length < 3) return -1

  // 使用移动窗口或全局中位数来评估“正常”波动范围
  const differences: number[] = []
  for (let i = 1; i < latencies.length; i++) {
    differences.push(latencies[i] - latencies[i - 1])
  }

  // 计算差异的中位数 (Median of Differences)
  const medianDiff = getMedian(differences)

  // 计算 MAD (Median Absolute Deviation) 以衡量波动的离散程度
  const absoluteDeviations = differences.map((d) => Math.abs(d - medianDiff))
  const mad = getMedian(absoluteDeviations) || 1 // 避免除以0

  for (let i = 1; i < latencies.length; i++) {
    const currentDiff = latencies[i] - latencies[i - 1]

    // 修正后的 Z-Score 算法
    // 如果当前增长量 > 正常增长波动的 sensitivity 倍，则视为断层
    const zScore = (0.6745 * currentDiff) / mad

    if (zScore > sensitivity) {
      // 找到突变点，返回当前索引
      return i
    }
  }

  return -1
}

function getMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

const TraceMessageDetail: React.FC<DetailComponentProps<TraceMessage>> = (
  props,
) => {
  const currentSelected = useRef<Invoke | undefined>(undefined)
  const context = useContext(ChannelContext)
  const root = props.msg.root
  const msg = `${root.threadName}(id=${root.threadId}; daemon=${root.daemon}; priority=
        ${root.priority}; classloader=${root.classloader}; ts=
        ${formatTime(root.timestamp)})`

  const { onContextMenu, menuProps } = useRightClickMenu()

  const onContextMenu0 = (invoke: Invoke, e: React.MouseEvent<unknown>) => {
    currentSelected.current = invoke
    onContextMenu(e)
  }

  const onAction = (key: string | number) => {
    const invoke = currentSelected.current!
    if (
      context.getQuickCommandExecutor().handleActions(key, {
        classname: invoke.className,
        methodName: invoke.methodName,
      })
    ) {
      return
    }
    switch (key) {
      case 'jad':
        context
          .getTabsController()
          .openTab('JAD', {}, { classname: invoke.className })
        break
    }
  }

  return (
    <div>
      <RightClickMenu {...menuProps} onAction={onAction}>
        <ListboxItem key="jad">反编译</ListboxItem>
        <ListboxItem key="watch">Watch</ListboxItem>
        <ListboxItem key="trace">Trace</ListboxItem>
        <ListboxItem key="stack">Stack</ListboxItem>
      </RightClickMenu>
      <div className="overflow-x-hidden font-bold">
        <Tooltip content={msg} className="">
          <div className="max-w-full overflow-x-hidden text-nowrap text-ellipsis">
            {msg}
          </div>
        </Tooltip>
      </div>
      {root.children.map((invoke, index) => (
        <TraceRow
          invoke={invoke}
          key={toKey(invoke)}
          onMenuContext={onContextMenu0}
          level={1}
          isTail={index === root.children.length - 1}
        />
      ))}
    </div>
  )
}

export default TraceMessageDetail
