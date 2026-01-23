import type React from 'react'
import OgnlMessageView from '../_component/_ognl_result/OgnlMessageView.tsx'

const OgnlCommonMessageDetail: React.FC<{ raw: string }> = ({ raw }) => {
  return (
    <div className="text-sm">
      <OgnlMessageView raw={raw} />
    </div>
  )
}

export default OgnlCommonMessageDetail
