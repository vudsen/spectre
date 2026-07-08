import React from 'react'
import AiComposer from '@/pages/channel/[channelId]/_ai/AiComposer.tsx'
import AiMessageList from '@/pages/channel/[channelId]/_ai/AiMessageList.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import i18n from '@/i18n'
import type {
  ConversationCard,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'

export interface AiPanelEnabledContentProps {
  cards: ConversationCard[]
  pendingConfirms: PendingConfirmState[]
  currentAskHuman?: PendingAskHumanState
  autoConfirm?: boolean
  isLoading: boolean
  composerDisabled?: boolean
  onSubmit: (value: string) => Promise<void>
  onConfirm: (toolCallId: string, value: 'YES' | 'NO') => void
  onAutoConfirmAll: () => void
}

const AiPanelEnabledContent: React.FC<AiPanelEnabledContentProps> = ({
  cards,
  pendingConfirms,
  currentAskHuman,
  autoConfirm,
  isLoading,
  composerDisabled,
  onSubmit,
  onConfirm,
  onAutoConfirmAll,
}) => {
  return (
    <>
      {cards.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center">
          <SvgIcon className="text-primary" size={50} icon={ChannelIcon.AI} />
          <div className="text-primary">
            {i18n.t('channel.aiWelcomeMessage')}
          </div>
          <div className="text-small text-default-400">
            {i18n.t('channel.skillSelectTip')}
          </div>
        </div>
      ) : (
        <AiMessageList
          cards={cards}
          pendingConfirms={pendingConfirms}
          currentAskHuman={currentAskHuman}
          autoConfirm={autoConfirm}
          isLoading={isLoading}
          onConfirm={onConfirm}
          onAutoConfirmAll={onAutoConfirmAll}
        />
      )}
      <AiComposer
        disabled={composerDisabled || isLoading}
        onSubmit={onSubmit}
      />
    </>
  )
}

export default AiPanelEnabledContent
