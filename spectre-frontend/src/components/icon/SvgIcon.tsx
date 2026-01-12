import type { SVGAttributes } from 'react'

interface IconProps extends SVGAttributes<SVGSVGElement> {
  icon: string
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
