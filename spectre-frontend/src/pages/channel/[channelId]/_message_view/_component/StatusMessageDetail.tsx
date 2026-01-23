import type React from 'react'
import { Code } from '@heroui/react'
import type { DetailComponentProps } from '../factory.ts'

type StatusMessage = {
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
        执行命令{isSuccess ? '成功' : '失败'}, 响应码: {msg.statusCode}
      </div>
      {isSuccess ? null : (
        <>
          <div>错误信息:</div>
          <Code>{msg.message}</Code>
        </>
      )}
    </div>
  )
}

export default StatusMessageDetail
