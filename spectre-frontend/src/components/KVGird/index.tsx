import React, { type ReactElement } from 'react'
import type KVGridItem from '@/components/KVGird/KVGridItem.tsx'
import clsx from 'clsx'

interface KVGirdProps {
  children: ReactElement<typeof KVGridItem>[] | ReactElement<typeof KVGridItem>
}

const KVGird: React.FC<KVGirdProps> = (props) => {
  const nodes = Array.isArray(props.children)
    ? props.children
    : [props.children]
  return (
    <div
      className="grid grid-cols-3 text-sm"
      style={{
        gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))`,
      }}
    >
      {nodes.map((detail, index) => (
        <div
          key={index}
          className={clsx(
            index > 0 ? 'border-l-divider border-l-1 px-3' : undefined,
          )}
        >
          {detail}
        </div>
      ))}
    </div>
  )
}

export default KVGird
