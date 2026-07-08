import React from 'react'
import type {
  ConversationCard,
  PendingAskHumanState,
  PendingConfirmState,
} from '@/pages/channel/[channelId]/_ai/types.ts'
import AiPanelDisabledContent from '@/pages/channel/[channelId]/_ai/AiPanelDisabledContent.tsx'
import AiPanelEnabledContent from '@/pages/channel/[channelId]/_ai/AiPanelEnabledContent.tsx'

export interface AiPanelContentProps {
  enabled: boolean
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

const AiPanelContent: React.FC<AiPanelContentProps> = (props) => {
  if (!props.enabled) {
    return <AiPanelDisabledContent />
  }

  return (
    <AiPanelEnabledContent
      cards={props.cards}
      pendingConfirms={props.pendingConfirms}
      currentAskHuman={props.currentAskHuman}
      autoConfirm={props.autoConfirm}
      isLoading={props.isLoading}
      composerDisabled={props.composerDisabled}
      onSubmit={props.onSubmit}
      onConfirm={props.onConfirm}
      onAutoConfirmAll={props.onAutoConfirmAll}
    />
  )
}

export default AiPanelContent
