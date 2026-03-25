import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'
import i18n from '@/i18n'

export type StatusMessage = {
  type: 'status'
  statusCode: number
  jobId: number
  message?: string
}

const StatusMessageDetail: React.FC<DetailComponentProps<StatusMessage>> = ({
  msg,
}) => {
  const isSuccess = msg.statusCode === 0
  return (
    <div className="space-y-3 text-sm">
      <div className={isSuccess ? 'text-success' : 'text-danger'}>
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_statusmessagedetail_001',
        )}
        {isSuccess
          ? i18n.t('hardcoded.msg_pages_audit_index_002')
          : i18n.t('hardcoded.msg_pages_audit_index_003')}
        {i18n.t(
          'hardcoded.msg_pages_channel_param_message_view_component_statusmessagedetail_002',
        )}{' '}
        {msg.statusCode}
      </div>
      {isSuccess ? null : (
        <>
          <div>
            {i18n.t(
              'hardcoded.msg_pages_channel_param_message_view_component_statusmessagedetail_003',
            )}
          </div>
          <Code>{msg.message}</Code>
        </>
      )}
    </div>
  )
}

export default StatusMessageDetail
