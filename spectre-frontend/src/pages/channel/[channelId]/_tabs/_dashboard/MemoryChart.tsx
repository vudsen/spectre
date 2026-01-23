import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsType } from 'echarts/types/dist/shared'
import {
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  type TitleComponentOption,
  ToolboxComponent,
  type ToolboxComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
} from 'echarts/components'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { UniversalTransition } from 'echarts/features'

import { formatTime } from '@/common/util.ts'
import { Card, CardBody } from '@heroui/react'
import KVGird from '@/components/KVGird'
import KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import PercentageData from '@/pages/channel/[channelId]/_tabs/_dashboard/PercentageData.tsx'
import type {
  DashboardMessage,
  MemoryInfo,
} from '@/pages/channel/[channelId]/_message_view/_component/DashboardMessageDetail.tsx'

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
>

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
])

interface MemoryChartProps {
  lastMessage: DashboardMessage
}

type ChartData = {
  xAxiaData: string[]
  heap: number[]
  nonHeap: number[]
  bufferPool: number[]
}

type FormatterData = {
  value: number
  seriesName: string
  marker: string
}

const MemoryChart: React.FC<MemoryChartProps> = ({ lastMessage }) => {
  const chartDom = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType>(null)
  const chartData = useRef<ChartData>({
    bufferPool: [],
    heap: [],
    nonHeap: [],
    xAxiaData: [],
  })

  useEffect(() => {
    const echart = chart.current!
    if (!echart) {
      return
    }
    function calculateSumUsed(info: MemoryInfo[]): number {
      let total = 0
      for (const memoryInfo of info) {
        total += memoryInfo.used
      }
      return total / 1024 / 1024
    }

    const now = formatTime(lastMessage.runtimeInfo.timestamp)
    const data = chartData.current
    const myXAxiaData = data.xAxiaData
    if (myXAxiaData[myXAxiaData.length - 1] !== now) {
      data.xAxiaData.push(now)
      data.heap.push(calculateSumUsed(lastMessage.memoryInfo.heap))
      data.nonHeap.push(calculateSumUsed(lastMessage.memoryInfo.nonheap))
      data.bufferPool.push(calculateSumUsed(lastMessage.memoryInfo.buffer_pool))
      if (data.xAxiaData.length > 128) {
        data.xAxiaData.shift()
        data.heap.shift()
        data.nonHeap.shift()
        data.bufferPool.shift()
      }
      chart.current!.setOption({
        xAxis: {
          data: data.xAxiaData,
        },
        series: [
          { data: data.heap },
          { data: data.nonHeap },
          { data: data.bufferPool },
        ],
      })
    }
  }, [lastMessage])

  useEffect(() => {
    if (!chartDom.current) {
      return
    }
    const myChart = echarts.init(chartDom.current)
    chart.current = myChart
    const option: EChartsOption = {
      color: ['#B0E0E6', '#FFA07A', '#F0E68C'],
      title: {
        text: 'Memory',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (p) => {
          const params = p as FormatterData[]
          let res = `<div style="font-weight:bold;">${params[0].seriesName}`

          for (let i = params.length - 1; i >= 0; i--) {
            const item = params[i]
            res += `
              <div style="display:flex; justify-content:space-between; align-items:center; min-width:150px;">
                <span>${item.marker} ${item.seriesName}</span>
                <span style="font-weight:bold; margin-left:20px;">${item.value.toFixed(0)} MB</span>
              </div>
            `
          }
          return res
        },
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      legend: {
        data: ['Heap', 'Nonheap', 'buffer_pool'],
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
      },
      yAxis: [
        {
          type: 'value',
        },
      ],
      series: [
        {
          name: 'buffer_pool',
          type: 'line',
          stack: 'Total',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 0,
          },
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#B0E0E6',
              },
              {
                offset: 1,
                color: '#AFEEEE',
              },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: [],
        },
        {
          name: 'Nonheap',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0,
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#FFA07A',
              },
              {
                offset: 1,
                color: '#FFC0CB',
              },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: [],
        },
        {
          name: 'Heap',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0,
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#F0E68C',
              },
              {
                offset: 1,
                color: '#FFDAB9',
              },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: [],
        },
      ],
    }
    myChart.setOption(option)
    return () => {
      myChart.dispose()
    }
  }, [])

  return (
    <Card>
      <CardBody>
        <div ref={chartDom} className="h-96" />
        <div>
          <KVGird>
            {lastMessage.memoryInfo.heap.map((space) => (
              <KVGridItem name={space.name} key={space.type}>
                {(space.used / 1024 / 1024).toFixed(0)}MB&nbsp;/&nbsp;
                {(space.total / 1024 / 1024).toFixed(0)}MB&nbsp;(
                <PercentageData rate={space.used / space.total} />)
              </KVGridItem>
            ))}
          </KVGird>
        </div>
      </CardBody>
    </Card>
  )
}

export default MemoryChart
