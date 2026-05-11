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
  pendingConfirm?: PendingConfirmState
  pendingAskHuman?: PendingAskHumanState
  autoConfirm?: boolean
  isLoading: boolean
  eventsLength: number
  onSubmit: (value: string) => Promise<void>
}

const AiPanelContent: React.FC<AiPanelContentProps> = (props) => {
  if (!props.enabled) {
    return <AiPanelDisabledContent />
  }

  return (
    <AiPanelEnabledContent
      cards={props.cards}
      pendingConfirm={props.pendingConfirm}
      pendingAskHuman={props.pendingAskHuman}
      autoConfirm={props.autoConfirm}
      isLoading={props.isLoading}
      eventsLength={props.eventsLength}
      onSubmit={props.onSubmit}
    />
  )
}

export default AiPanelContent
