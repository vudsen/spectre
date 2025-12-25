import { graphql } from '@/graphql/generated'
import React, { useState } from 'react'
import useGraphQL from '@/hook/useGraphQL.ts'
import {
  Button,
  Code,
  Drawer,
  DrawerContent,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import LogDetailDrawerContent from '@/pages/audit/LogDetailDrawerContent.tsx'
import type { DocumentResult } from '@/graphql/execute.ts'
import Time from '@/components/Time.tsx'
import { useTranslation } from 'react-i18next'

const LogEntityQuery = graphql(`
  query LogEntityQuery($page: Int!, $size: Int!) {
    log {
      logs(page: $page, size: $size) {
        totalPages
        result {
          id
          ip
          isSuccess
          operation
          time
          username
        }
      }
    }
  }
`)

type LogEntity = DocumentResult<
  typeof LogEntityQuery
>['log']['logs']['result'][number]

const AuditPage: React.FC = () => {
  const { t } = useTranslation()
  const [qlArgs, setQlArgs] = useState({
    page: 0,
    size: 10,
  })
  const [selectedEntity, setSelectedEntity] = useState<LogEntity>()
  const { onOpen, onOpenChange, isOpen } = useDisclosure()
  const { result, isLoading } = useGraphQL(LogEntityQuery, qlArgs)

  const viewLog = (log: LogEntity) => {
    setSelectedEntity(log)
    onOpen()
  }

  const totalPage = result?.log.logs.totalPages ?? 0
  return (
    <div className="mx-6">
      <div className="spectre-heading">{t('router.audit')}</div>
      <Table
        removeWrapper
        aria-label="Log list"
        bottomContent={
          totalPage > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={qlArgs.page + 1}
                total={totalPage}
                onChange={(p) => setQlArgs({ page: p - 1, size: qlArgs.size })}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>操作名称</TableColumn>
          <TableColumn>{t('common.username')}</TableColumn>
          <TableColumn>IP</TableColumn>
          <TableColumn>{t('common.opTime')}</TableColumn>
          <TableColumn>{t('common.status')}</TableColumn>
          <TableColumn align="end">{t('common.action')}</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          items={result?.log.logs.result ?? []}
          loadingContent={<TableLoadingMask />}
        >
          {(log) => (
            <TableRow key={log.id}>
              <TableCell>{log.operation}</TableCell>
              <TableCell>
                <Code>{log.username}</Code>
              </TableCell>
              <TableCell>{log.ip}</TableCell>
              <TableCell>
                <Time time={log.time} />
              </TableCell>
              <TableCell>
                {log.isSuccess ? (
                  <div className="text-success">成功</div>
                ) : (
                  <div className="text-danger">失败</div>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="light"
                  color="primary"
                  onPress={() => viewLog(log)}
                >
                  查看
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(onClose) => (
            <LogDetailDrawerContent
              logEntity={selectedEntity!}
              onClose={onClose}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default AuditPage
