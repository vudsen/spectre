import type React from 'react'
import ToolchainBundle from './ToolchainBundle.tsx'
import i18n from '@/i18n'

const ToolchainBundlePage: React.FC = () => {
  return (
    <div className="px-6">
      <div className="mb-3 text-xl font-semibold">
        {i18n.t('hardcoded.msg_pages_toolchain_bundles_index_001')}
      </div>
      <ToolchainBundle />
    </div>
  )
}

export default ToolchainBundlePage
