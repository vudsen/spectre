import type React from 'react'
import { useMemo } from 'react'
import { formatTime, toDate } from '@/common/util.ts'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Tooltip } from '@heroui/react'

interface TimeProps {
  time: string | number
}
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30
const YEAR = MONTH * 356

function toHumanReadableDate(date: Date, t: TFunction): string {
  const gap = Date.now() - date.getTime()
  if (gap < 0) {
    return formatTime(date.getTime())
  }
  if (gap < MINUTE) {
    return t('common.secondAgo', { count: Math.ceil(gap / SECOND) })
  } else if (gap < HOUR) {
    return t('common.minuteAgo', { count: Math.ceil(gap / MINUTE) })
  } else if (gap < DAY) {
    return t('common.hourAgo', { count: Math.ceil(gap / HOUR) })
  } else if (gap < MONTH) {
    return t('common.dayAgo', { count: Math.floor(gap / DAY) })
  } else if (gap < YEAR) {
    return t('common.monthAgo', { count: Math.floor(gap / MONTH) })
  }
  return t('common.yearAgo', { count: Math.floor(gap / YEAR) })
}

type DateInfo = {
  exact: string
  relative: string
}

const Time: React.FC<TimeProps> = (props) => {
  const { t } = useTranslation()
  const info: DateInfo = useMemo(() => {
    return {
      exact: formatTime(props.time),
      relative: toHumanReadableDate(toDate(props.time), t),
    }
  }, [props.time, t])

  return (
    <Tooltip content={info.exact}>
      <span className="inline-block">{info.relative}</span>
    </Tooltip>
  )
}

export default Time
