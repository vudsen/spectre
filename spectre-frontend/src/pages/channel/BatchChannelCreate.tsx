import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { batchCreateInstances, createBatchChannel } from '@/api/impl/arthas.ts'
import { useNavigate } from 'react-router'
import i18n from '@/i18n'

type ChannelCreateRequest = {
  treeNodeId: string
  bundleId: string
  runtimeNodeId: string
  name: string
}

export interface BatchChannelCreateProps {
  channels: ChannelCreateRequest[]
}

type ChannelState = 'pending' | 'success' | 'error'

type MyChannel = {
  state: ChannelState
  message: string
  stopped: boolean
} & ChannelCreateRequest

type PollState = {
  lastId?: number
  isStopped: boolean
}

const BatchChannelCreate: React.FC<BatchChannelCreateProps> = (props) => {
  const nav = useNavigate()
  const isCreatingChannel = useRef(false)
  const [channels, setChannels] = useState<MyChannel[]>(() =>
    props.channels.map((channel) => ({
      ...channel,
      state: 'pending',
      message: '',
      stopped: false,
    })),
  )
  const pollState = useRef<PollState>({
    isStopped: false,
  })

  const doPoll = useCallback(() => {
    if (pollState.current.isStopped) {
      return
    }
    setChannels((channels) => {
      const preNewChannels = [...channels]
      const nextPollChannels: MyChannel[] = []
      let successCount = 0
      for (let i = 0; i < channels.length; i++) {
        const channel = channels[i]
        if (channel.state === 'success') {
          successCount++
        }
        if (!channel.stopped && channel.state !== 'success') {
          nextPollChannels.push(channel)
          preNewChannels[i].state = 'pending'
          // preNewChannels[i].message = '正在连接中'
        }
      }
      if (successCount === channels.length) {
        if (isCreatingChannel.current) {
          return channels
        }
        isCreatingChannel.current = true
        createBatchChannel(channels.map((ch) => ch.treeNodeId)).then((r) => {
          nav(`/channel/${r}`)
        })
        return channels
      }
      if (nextPollChannels.length === 0) {
        return channels
      }
      clearTimeout(pollState.current.lastId)
      pollState.current.lastId = setTimeout(async () => {
        if (pollState.current.isStopped) {
          return
        }
        const status = await batchCreateInstances(nextPollChannels)
        setChannels((prevState) => {
          const newChannels = [...prevState]
          let nextRetryTime = 0
          for (const nextPollChannel of nextPollChannels) {
            const current = status[nextPollChannel.treeNodeId]
            const i = prevState.findIndex(
              (p) => p.treeNodeId === nextPollChannel.treeNodeId,
            )
            if (current.error) {
              newChannels[i].state = 'error'
              newChannels[i].message = current.error.message
              nextRetryTime = Math.max(
                nextRetryTime,
                Number.parseInt(current.error.nextRetryTime),
              )
            } else if (current.isReady) {
              newChannels[i].state = 'success'
              newChannels[i].message = i18n.t('channel.connected')
            } else {
              newChannels[i].state = 'pending'
              newChannels[i].message =
                current.message ?? current.title ?? i18n.t('channel.connecting')
            }
          }
          if (nextRetryTime > 0) {
            const delay = nextRetryTime - Date.now()
            if (delay <= 100) {
              doPoll()
            } else {
              setTimeout(() => {
                doPoll()
              }, delay)
            }
          } else {
            doPoll()
          }
          return newChannels
        })
      }, 1000)
      return preNewChannels
    })
  }, [nav])

  useEffect(() => {
    const state = pollState.current
    state.isStopped = false
    doPoll()
    return () => {
      clearTimeout(state.lastId)
      state.isStopped = true
    }
  }, [doPoll])

  const stopRetry = useCallback((id: string) => {
    setChannels((prevState) => {
      const newChannels = [...prevState]
      const target = newChannels.find((ch) => ch.treeNodeId === id)
      if (target) {
        target.stopped = true
        return newChannels
      } else {
        return prevState
      }
    })
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="text-primary text-bold mb-5 text-lg">
        {i18n.t('channel.connecting')}
      </div>
      <Table hideHeader aria-label="Connections" className="max-w-256">
        <TableHeader>
          <TableColumn>Status</TableColumn>
          <TableColumn>Name</TableColumn>
          <TableColumn>Message</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {channels.map((channel) => (
            <TableRow key={channel.treeNodeId}>
              <TableCell className="w-8">
                {channel.state === 'pending' ? (
                  <Spinner color="primary" size="sm" />
                ) : null}
                {channel.state === 'success' ? (
                  <SvgIcon
                    icon={Icon.CHECK}
                    size={22}
                    className="text-success"
                  />
                ) : null}
                {channel.state === 'error' ? (
                  <SvgIcon
                    icon={Icon.CLOSE}
                    size={22}
                    className="text-danger"
                  />
                ) : null}
              </TableCell>
              <TableCell className="w-64">{channel.name}</TableCell>
              <TableCell className="max-w-168 truncate">
                {channel.message}
              </TableCell>
              <TableCell>
                {channel.state === 'error' && !channel.stopped ? (
                  <Button
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={() => stopRetry(channel.treeNodeId)}
                  >
                    {i18n.t('channel.stopRetry')}
                  </Button>
                ) : null}
                {channel.state === 'error' && channel.stopped ? (
                  <div className="text-danger">
                    {i18n.t('channel.retryStopped')}
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default BatchChannelCreate
