import React, { useCallback } from 'react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import { Link } from '@heroui/react'
import i18n from 'i18next'

const AiPanelDisabledContent: React.FC = () => {
  const goLLMConfigPage = useCallback(() => {
    window.open(`${import.meta.env.VITE_BASE_PATH}/settings`)
  }, [])
  return (
    <div className="flex grow flex-col items-center justify-center gap-2">
      <SvgIcon className="text-warning" size={50} icon={ChannelIcon.AI} />
      <div className="text-warning">{i18n.t('channel.llmDisabled')}</div>
      <Link onPress={goLLMConfigPage} href="#" underline="always" size="sm">
        {i18n.t('channel.goOpen')}
      </Link>
    </div>
  )
}

export default AiPanelDisabledContent
