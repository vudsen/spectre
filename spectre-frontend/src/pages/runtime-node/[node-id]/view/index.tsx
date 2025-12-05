import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import { viewRuntimeNode } from '@/api/impl/runtime-node.ts'
import ExtensionPageManager from '@/ext/manager.ts'

const RuntimeNodeView: React.FC = () => {
  const params = useParams()
  const nodeId = params['node-id'] ?? '-1'
  const [ViewPage, setViewPage] = useState<React.ReactNode>(undefined)

  useEffect(() => {
    viewRuntimeNode(nodeId).then((r) => {
      const Component = ExtensionPageManager.getViewComponent(r.pageName)

      setViewPage(<Component data={r.parameters} />)
    })
  }, [nodeId])
  if (ViewPage) {
    return ViewPage
  }
  return <TableLoadingMask />
}

export default RuntimeNodeView
