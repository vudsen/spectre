import type React from 'react'
import ToolchainBundle from './ToolchainBundle.tsx'

const ToolchainBundlePage: React.FC = () => {
  return (
    <div className="px-6">
      <div className="mb-3 text-xl font-semibold">工具包设置</div>
      <ToolchainBundle />
    </div>
  )
}

export default ToolchainBundlePage
