import React from 'react'
import clsx from 'clsx'

export type Detail = {
  name: string
  value: React.ReactNode
}
interface DetailGridProps {
  details: Detail[]
}

const DetailGrid: React.FC<DetailGridProps> = (props) => {
  return (
    <div
      className="grid grid-cols-3 text-sm"
      style={{
        gridTemplateColumns: `repeat(${props.details.length}, minmax(0, 1fr))`,
      }}
    >
      {props.details.map((detail, index) => (
        <div
          key={detail.name}
          className={clsx(
            index > 0 ? 'border-l-divider border-l-1 px-3' : undefined,
          )}
        >
          <div className="font-bold">{detail.name}</div>
          <div className="font-normal">{detail.value}</div>
        </div>
      ))}
    </div>
  )
}

export default DetailGrid
