import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import { listProfilerFiles, type ProfilerFile } from '@/api/impl/arthas.ts'
import { store } from '@/store'
import Time from '@/components/Time.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import TableLoadingMask from '@/components/TableLoadingMask.tsx'
import SampleController from '@/pages/channel/[channelId]/_tabs/_profiler/SampleController.tsx'

const ProfilerTab: React.FC = () => {
  const [profilerFiles, setProfilerFiles] = useState<ProfilerFile[]>([])
  const [isProfilerTableLoading, setProfilerTableLoading] = useState(false)
  const [currentProfilerFiles, setCurrentProfilerFiles] = useState<
    ProfilerFile[]
  >([])

  const onRefresh = useCallback(() => {
    setProfilerTableLoading(true)
    listProfilerFiles(store.getState().channel.context.channelId)
      .then((r) => {
        r.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        setProfilerFiles(r)

        const current: ProfilerFile[] = []
        for (const profilerFile of r) {
          if (
            profilerFile.channelId ===
            store.getState().channel.context.channelId
          ) {
            current.push(profilerFile)
          }
        }
        setCurrentProfilerFiles(current)
      })
      .finally(() => {
        setProfilerTableLoading(false)
      })
  }, [])

  useEffect(() => {
    onRefresh()
  }, [])

  const viewHtml = (file: ProfilerFile) => {
    window.open(
      `${location.origin}${import.meta.env.VITE_API_BASE_PATH}/arthas/channel/${store.getState().channel.context.channelId}/profiler/html?timestamp=${file.timestamp}&channelId=${file.channelId}&extension=${file.extension}`,
    )
  }

  const downloadFile = (file: ProfilerFile) => {
    window.open(
      `${location.origin}${import.meta.env.VITE_API_BASE_PATH}/arthas/channel/${store.getState().channel.context.channelId}/profiler/download?timestamp=${file.timestamp}&channelId=${file.channelId}&extension=${file.extension}`,
    )
  }

  return (
    <div className="space-y-3 p-3 pb-16">
      <SampleController onSampleRecorded={onRefresh} />
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="header-2">当前频道已生成的记录</div>
            <Button
              color="primary"
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onRefresh}
            >
              <SvgIcon icon={Icon.REFRESH} />
            </Button>
          </div>
          <Table
            removeWrapper
            className="overflow-hidden"
            aria-label="Profiler files"
          >
            <TableHeader>
              <TableColumn>ChannelId</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>类型</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={'没有任何采样'}
              items={currentProfilerFiles}
              isLoading={isProfilerTableLoading}
              loadingContent={<TableLoadingMask />}
            >
              {(profilerFile) => (
                <TableRow key={profilerFile.timestamp}>
                  <TableCell>{profilerFile.channelId}</TableCell>
                  <TableCell>
                    <Time time={profilerFile.timestamp} />
                  </TableCell>
                  <TableCell>{profilerFile.extension}</TableCell>
                  <TableCell>
                    {profilerFile.extension === 'html' ? (
                      <Button
                        isIconOnly
                        color="primary"
                        variant="light"
                        onPress={() => viewHtml(profilerFile)}
                      >
                        <SvgIcon icon={Icon.VIEW} />
                      </Button>
                    ) : null}
                    <Button
                      isIconOnly
                      color="primary"
                      variant="light"
                      onPress={() => downloadFile(profilerFile)}
                    >
                      <SvgIcon icon={Icon.DOWNLOAD} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="header-2">当前节点已生成的记录</div>
            <Button
              color="primary"
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onRefresh}
            >
              <SvgIcon icon={Icon.REFRESH} />
            </Button>
          </div>
          <div className="text-warning text-sm">
            注: 当记录超过 10 条将会删除最旧的一条.
            对于非容器环境，所有的文件共享一个计数。
          </div>
          <Table
            removeWrapper
            className="overflow-hidden"
            aria-label="Profiler files"
          >
            <TableHeader>
              <TableColumn>ChannelId</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>类型</TableColumn>
              <TableColumn align="end">操作</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={'没有任何采样'}
              items={profilerFiles}
              isLoading={isProfilerTableLoading}
              loadingContent={<TableLoadingMask />}
            >
              {(profilerFile) => (
                <TableRow key={profilerFile.timestamp}>
                  <TableCell>{profilerFile.channelId}</TableCell>
                  <TableCell>
                    <Time time={profilerFile.timestamp} />
                  </TableCell>
                  <TableCell>{profilerFile.extension}</TableCell>
                  <TableCell>
                    {profilerFile.extension === 'html' ? (
                      <Button
                        isIconOnly
                        color="primary"
                        variant="light"
                        onPress={() => viewHtml(profilerFile)}
                      >
                        <SvgIcon icon={Icon.VIEW} />
                      </Button>
                    ) : null}
                    <Button
                      isIconOnly
                      color="primary"
                      variant="light"
                      onPress={() => downloadFile(profilerFile)}
                    >
                      <SvgIcon icon={Icon.DOWNLOAD} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  )
}

export default ProfilerTab
