import React, { useCallback, useContext, useEffect, useState } from 'react'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import { executeArthasCommandSync } from '@/api/impl/arthas.ts'
import { store } from '@/store'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import type { StatusMessage } from '@/pages/channel/[channelId]/_message_view/_component/StatusMessageDetail.tsx'
import type { ProfilerMessage } from '@/pages/channel/[channelId]/_message_view/_component/ProfilerMessageDetail.tsx'

interface StartNewSampleModalContentProps {
  onClose: () => void
  onStart: () => void
}
type Values = {
  command: string
}
const StartNewSampleModalContent: React.FC<StartNewSampleModalContentProps> = (
  props,
) => {
  const { control, trigger, getValues, setError } = useForm<Values>({
    defaultValues: {
      command: 'profiler start --format html',
    },
  })
  const [isLoading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (!values.command.startsWith('profiler')) {
      setError('command', { message: '只能执行 profiler 命令' })
      return
    }
    setLoading(true)
    try {
      const r = await executeArthasCommandSync(
        store.getState().channel.context.channelId,
        values.command,
      )
      const status = r.find((r) => r.type === `status`)
      if (!status) {
        addToast({
          title: '开启采样失败, 请稍后重试',
          color: 'danger',
        })
        return
      }
      const s = status as StatusMessage
      if (s.statusCode === 0) {
        addToast({
          title: '开启采样成功',
          color: 'success',
        })
        props.onClose()
        props.onStart()
      } else {
        addToast({
          title: '开启采样失败',
          description: s.message,
          color: 'danger',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ModalHeader>
        <div>开启新的采样</div>
      </ModalHeader>
      <ModalBody>
        <ControlledInput
          control={control}
          name="command"
          inputProps={{
            label: '命令',
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="light" color="danger" isDisabled={isLoading}>
          取消
        </Button>
        <Button
          variant="solid"
          color="primary"
          onPress={onSubmit}
          isLoading={isLoading}
        >
          开启
        </Button>
      </ModalFooter>
    </>
  )
}
type StopSampleValues = {
  command: string
}

interface StopSampleModalContentProps {
  onClose: () => void
  onSampleRecorded: () => void
}

const StopSampleModalContent: React.FC<StopSampleModalContentProps> = ({
  onClose,
  onSampleRecorded,
}) => {
  const [isLoading, setLoading] = useState(false)
  const { control, trigger, getValues, setError } = useForm<StopSampleValues>({
    defaultValues: {
      command: 'profiler stop',
    },
  })

  const onSubmit = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (!values.command.startsWith('profiler stop')) {
      setError('command', {
        message: '只能执行 profiler stop 命令',
      })
      return
    }
    setLoading(true)
    try {
      await executeArthasCommandSync(
        store.getState().channel.context.channelId,
        values.command,
      )
      onSampleRecorded()
      onClose()
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <ModalHeader>停止采样</ModalHeader>
      <ModalBody>
        <ControlledInput
          control={control}
          name="command"
          inputProps={{
            label: '命令',
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          variant="light"
          color="danger"
          isDisabled={isLoading}
          onPress={onClose}
        >
          取消
        </Button>
        <Button
          variant="solid"
          color="primary"
          onPress={onSubmit}
          isLoading={isLoading}
        >
          停止
        </Button>
      </ModalFooter>
    </>
  )
}

const PROFILER_RUNNING_TEXT_PREFIX = 'Profiling is running for '

interface SampleControllerProps {
  onSampleRecorded: () => void
}

const SampleController: React.FC<SampleControllerProps> = ({
  onSampleRecorded,
}) => {
  const [profilerActiveTime, setProfilerActiveTime] = useState(-1)
  const context = useContext(ChannelContext)
  const startProfilerDisclosure = useDisclosure()
  const stopProfilerDisclosure = useDisclosure()
  const [isRefreshing, setRefreshing] = useState(false)
  const [showRefreshDone, setShowRefreshDone] = useState(false)

  const refreshStatus = useCallback(async () => {
    setRefreshing(true)
    try {
      const r = await executeArthasCommandSync(
        store.getState().channel.context.channelId,
        'profiler status',
      )
      const profiler0 = r.find((resp) => resp.type === 'profiler')
      if (!profiler0) {
        return
      }
      const profiler = profiler0 as ProfilerMessage
      setShowRefreshDone(true)
      setTimeout(() => {
        setShowRefreshDone(false)
      }, 1000)
      if (profiler.executeResult.startsWith('Profiler is not active')) {
        setProfilerActiveTime(-1)
        return
      } else if (
        profiler.executeResult.startsWith(PROFILER_RUNNING_TEXT_PREFIX)
      ) {
        let numStr = ''
        for (
          let i = PROFILER_RUNNING_TEXT_PREFIX.length;
          i < profiler.executeResult.length;
          i++
        ) {
          if (
            profiler.executeResult[i] <= '9' &&
            profiler.executeResult[i] >= '0'
          ) {
            numStr = numStr + profiler.executeResult[i]
          } else {
            break
          }
        }
        setProfilerActiveTime(Number.parseInt(numStr))
      }
    } finally {
      setRefreshing(false)
    }
  }, [])
  useEffect(() => {
    refreshStatus().then()
  }, [context, refreshStatus])

  const onStart = useCallback(() => {
    setProfilerActiveTime(1)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setProfilerActiveTime((prev) => {
        if (prev > 0) {
          return prev + 1
        }
        return prev
      })
    }, 1000)
    return () => {
      clearInterval(id)
    }
  })

  const onSampleRecorded0 = () => {
    setProfilerActiveTime(-1)
    onSampleRecorded()
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">开始新的采样</div>
        <div className="flex items-center">
          <span>
            当前状态：
            {profilerActiveTime > 0 ? (
              <span className="text-success">
                已运行 {profilerActiveTime} 秒
              </span>
            ) : (
              <span className="text-warning">已停止</span>
            )}{' '}
          </span>
          <Button size="sm" isIconOnly variant="light" onPress={refreshStatus}>
            {showRefreshDone ? (
              <SvgIcon icon={Icon.CHECK} className="text-success" />
            ) : (
              <SvgIcon
                icon={Icon.REFRESH}
                className={isRefreshing ? 'animate-spin' : undefined}
              />
            )}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            isDisabled={profilerActiveTime >= 0}
            color="primary"
            onPress={startProfilerDisclosure.onOpen}
          >
            开始新的采样
          </Button>
          <Button
            isDisabled={profilerActiveTime < 0}
            color="danger"
            onPress={stopProfilerDisclosure.onOpen}
          >
            终止采样
          </Button>
        </div>
      </CardBody>
      <Modal
        size="2xl"
        isOpen={startProfilerDisclosure.isOpen}
        onOpenChange={startProfilerDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <StartNewSampleModalContent onStart={onStart} onClose={onClose} />
          )}
        </ModalContent>
      </Modal>
      <Modal
        size="2xl"
        isOpen={stopProfilerDisclosure.isOpen}
        onOpenChange={stopProfilerDisclosure.onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <StopSampleModalContent
              onClose={onClose}
              onSampleRecorded={onSampleRecorded0}
            />
          )}
        </ModalContent>
      </Modal>
    </Card>
  )
}

export default SampleController
