import React from 'react'

interface KVGridItemProps {
  name: string
  children: React.ReactNode
}
const KVGridItem: React.FC<KVGridItemProps> = (props) => {
  return (
    <>
      <div className="font-bold">{props.name}</div>
      <div className="font-normal">{props.children}</div>
    </>
  )
}

export default KVGridItem
