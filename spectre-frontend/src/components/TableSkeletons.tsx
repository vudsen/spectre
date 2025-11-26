import { Skeleton } from '@heroui/react'
import React from 'react'

interface TableSkeletonsProps {
  count?: number
}
const TableSkeletons: React.FC<TableSkeletonsProps> = ({ count = 5 }) => {
  return (
    <div className="mt-5 box-border w-full space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton className="rounded-lg" key={idx}>
          <div className="bg-default-300 h-10 w-full rounded-lg" />
        </Skeleton>
      ))}
    </div>
  )
}

export default TableSkeletons
