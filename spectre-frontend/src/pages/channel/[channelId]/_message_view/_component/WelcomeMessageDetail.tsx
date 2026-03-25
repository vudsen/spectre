import { Code, Link } from '@heroui/react'
import type React from 'react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'

type WelcomeMessage = {
  type: 'welcome'
  jobId: number
  mainClass: string
  pid: string
  time: string
  tutorials: string
  version: string
  wiki: string
}

const WelcomeMessageDetail: React.FC<DetailComponentProps<WelcomeMessage>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-primary font-bold">
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_001',
        )}
      </div>
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_002',
        )}{' '}
        <Code>{props.msg.version}</Code>
      </div>
      <div>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_003',
        )}{' '}
        <Code style={{ textWrap: 'wrap' }}>{props.msg.mainClass}</Code>
      </div>
      <div className="flex">
        <Link href={props.msg.wiki} isExternal size="sm">
          Wiki
        </Link>
        <Link href={props.msg.tutorials} isExternal className="ml-2" size="sm">
          {i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_component_welcomemessagedetail_004',
          )}
        </Link>
      </div>
    </div>
  )
}

export default WelcomeMessageDetail
