import clsx from 'clsx'

interface PercentageDataProps {
  /**
   * 比例，不需要乘以 100
   */
  rate: number
}

/**
 * 为百分比增加颜色
 */
const PercentageData: React.FC<PercentageDataProps> = ({ rate }) => {
  return (
    <span
      className={clsx({
        'text-danger': rate >= 0.8,
        'text-warning': rate >= 0.6 && rate < 0.8,
        'text-success': rate < 0.6,
      })}
    >
      {(rate * 100).toFixed(0)}%
    </span>
  )
}

export default PercentageData
