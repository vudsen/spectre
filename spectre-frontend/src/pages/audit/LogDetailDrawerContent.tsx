import { DrawerBody, DrawerHeader, Spinner } from '@heroui/react'
import React, { useMemo } from 'react'
import clsx from 'clsx'
import { formatTime } from '@/common/util.ts'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'

interface LogDetailDrawerContentProps {
  logEntity: {
    id: string
    ip: string
    isSuccess: boolean
    operation: string
    time: string
    username: string
  }
  onClose: () => void
}

const LogDetailQuery = graphql(`
  query LogDetailQuery($id: Long!) {
    log {
      log(id: $id) {
        userAgent
        message
        context
      }
    }
  }
`)

const LogDetailDrawerContent: React.FC<LogDetailDrawerContentProps> = ({
  logEntity,
}) => {
  const qlArg = useMemo(
    () => ({
      id: logEntity.id,
    }),
    [logEntity.id],
  )
  const { result, isLoading } = useGraphQL(LogDetailQuery, qlArg)

  const logDetail = result?.log.log
  return (
    <>
      <DrawerHeader>操作日志: {logEntity.operation}</DrawerHeader>
      <DrawerBody>
        <div>
          <span className="text-sm font-bold">操作名称: </span>
          <span className="text-default-600 text-sm">
            {logEntity.operation}
          </span>
        </div>
        <div>
          <span className="text-sm font-bold">操作结果: </span>
          <span
            className={clsx(
              'text-sm',
              logEntity.isSuccess ? 'text-success' : 'text-danger',
            )}
          >
            {logEntity.isSuccess ? '成功' : '失败'}
          </span>
        </div>
        <div>
          <span className="text-sm font-bold">用户名: </span>
          <span className="text-default-600 text-sm">{logEntity.username}</span>
        </div>
        <div>
          <span className="text-sm font-bold">IP: </span>
          <span className="text-default-600 text-sm">{logEntity.ip}</span>
        </div>
        <div>
          <span className="text-sm font-bold">操作时间: </span>
          <span className="text-default-600 text-sm">
            {formatTime(logEntity.time)}
          </span>
        </div>
        {isLoading ? (
          <div>
            <Spinner variant="wave" />
            <div>加载额外信息中</div>
          </div>
        ) : null}
        {logDetail ? (
          <>
            <div>
              <span className="text-sm font-bold">User Agent: </span>
              <span className="text-default-600 text-sm">
                {logDetail.userAgent}
              </span>
            </div>
            <div>
              <span className="text-sm font-bold">详细信息: </span>
              <span className="text-default-600 text-sm">
                {logDetail.message ?? '-'}
              </span>
            </div>
            <div>
              <span className="text-sm font-bold">上下文信息: </span>
              <div className="text-default-700 bg-default-100 box-border rounded-xl p-3 text-sm whitespace-pre-wrap">
                {logDetail.context
                  ? JSON.stringify(JSON.parse(logDetail.context), null, 2)
                  : 'null'}
              </div>
            </div>
          </>
        ) : null}
      </DrawerBody>
    </>
  )
}

export default LogDetailDrawerContent
