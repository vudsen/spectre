import type { SVGAttributes } from 'react'
import type { Icons } from '@/components/icon/icon.ts'

interface IconProps extends SVGAttributes<SVGSVGElement> {
  icon: Icons
  size?: number
}

const SvgIcon: React.FC<IconProps> = (props) => {
  const size = props.size ?? 16
  return (
    <svg {...props} width={props.width || size} height={props.height || size}>
      <use xlinkHref={'#' + props.icon} />
    </svg>
  )
}

export default SvgIcon
