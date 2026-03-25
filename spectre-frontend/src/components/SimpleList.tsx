import { Code } from '@heroui/react'
import i18n from '@/i18n'

interface SimpleListProps {
  entities: string[]
  name: string
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}
const SimpleList: React.FC<SimpleListProps> = ({ entities, color, name }) => {
  return (
    <div>
      <span className="text-sm font-bold">{name}:</span>
      {entities.length > 0 ? (
        <ul className="mt-3 ml-6 list-disc space-y-2">
          {entities.map((entity) => (
            <li key={entity}>
              <Code color={color}>{entity}</Code>
            </li>
          ))}
        </ul>
      ) : (
        <span className="ml-2">
          {i18n.t('hardcoded.msg_components_simplelist_001')}
        </span>
      )}
    </div>
  )
}

export default SimpleList
