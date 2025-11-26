import { Chip } from '@heroui/react'

interface LabelsDisplayProps {
  attributes?: Record<string, string> | null
}

/**
 * 展示所有的属性
 */
const LabelsDisplay: React.FC<LabelsDisplayProps> = (props) => {
  if (!props.attributes) {
    return null
  }
  const attrs = Object.entries(props.attributes)
  return (
    <div>
      {attrs.map(([key, value]) => (
        <Chip key={key} size="sm" color="primary">
          {key}={value}
        </Chip>
      ))}
    </div>
  )
}

export default LabelsDisplay
