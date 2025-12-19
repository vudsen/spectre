import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ArthasResponse,
  disconnectSession,
  type InputStatusResponse,
  pullResults,
} from '@/api/impl/arthas.ts'
import { Button, Code, Divider, Tooltip } from '@heroui/react'
import ArthasResponseDetail from '@/pages/channel/[channelId]/ArthasResponseDetail.tsx'
import { isErrorResponse } from '@/api/types.ts'
import { handleError, showDialog } from '@/common/util.ts'
import CommandExecuteBlock from '@/pages/channel/[channelId]/CommandExecuteBlock.tsx'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import ArthasResponseList from '@/pages/channel/[channelId]/ArthasResponseList.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { appendMessages, clearExpiredMessages } from '@/store/channelSlice'
import { useNavigate } from 'react-router'

interface ArthasInteractionPageProps {
  channelId: string
  appName: string
}

const ArthasInteractionPage: React.FC<ArthasInteractionPageProps> = (props) => {
  const messages = useSelector<RootState, ArthasResponse[]>(
    (state) => state.channel.messages[props.channelId] ?? [],
  )
  const dispatch = useDispatch()
  const [inputStatus, setInputStatus] = useState<
    InputStatusResponse['inputStatus']
  >(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.type === 'input_status') {
        return msg.inputStatus
      }
    }
    return 'DISABLED'
  })
  const [selectedEntity, setSelectedEntity] = useState<ArthasResponse>()
  const pullResultsTaskId = useRef<number>(undefined)
  const taskDelay = useRef(0)
  const [isDebugMode, setDebugMode] = useState(false)
  const isExcited = useRef(false)
  const isFetching = useRef(false)
  const nav = useNavigate()

  const doPullResults = useCallback(async (): Promise<number> => {
    try {
      const channelId = props.channelId
      const r = await pullResults(channelId)
      for (const resp of r) {
        if (resp.type === 'input_status') {
          setInputStatus(resp.inputStatus)
        }
      }
      if (r.length > 0) {
        dispatch(
          appendMessages({
            messages: r,
            channelId,
          }),
        )
      }
      return r.length
    } catch (e) {
      if (isErrorResponse(e) && e.code === '0001') {
        showDialog({
          title: '拉取结果失败',
          message: e.message,
          color: 'danger',
          onConfirm() {
            location.reload()
          },
        })
      } else {
        handleError(e)
      }
      return Promise.reject(e)
    }
  }, [dispatch, props.channelId])

  const launchPullResultTask = useCallback(() => {
    if (isExcited.current || isFetching.current) {
      return
    }
    isFetching.current = true
    doPullResults()
      .then((messageCount) => {
        if (messageCount > 0) {
          taskDelay.current = 0
        } else {
          taskDelay.current = Math.min(taskDelay.current + 1000, 10 * 1000)
        }
        pullResultsTaskId.current = setTimeout(() => {
          launchPullResultTask()
        }, taskDelay.current)
      })
      .finally(() => {
        isFetching.current = false
      })
  }, [doPullResults])

  useEffect(() => {
    isExcited.current = false
    launchPullResultTask()
    dispatch(clearExpiredMessages())
    return () => {
      isExcited.current = true
      if (pullResultsTaskId.current) {
        clearTimeout(pullResultsTaskId.current)
      }
    }
  }, [dispatch, launchPullResultTask, props.channelId])

  const disconnect = useCallback(() => {
    showDialog({
      title: '断开连接',
      message: '您可能会丢失所有的消息，确定断开连接吗?',
      color: 'danger',
      onConfirm() {
        // TODO fullscreen mask.
        disconnectSession(props.channelId).then(() => {
          nav('/runtime-node/list')
        })
      },
    })
  }, [nav, props.channelId])

  return (
    <div className="flex h-screen flex-col">
      <div className="h-navbar mx-3 flex items-center justify-between">
        <div className="flex max-w-1/2 items-center">
          <span className="font-bold text-nowrap">&gt; 已连接到:&nbsp;</span>
          <Tooltip content={props.appName}>
            <Code className="cursor-pointer truncate" color="primary">
              {props.appName}
            </Code>
          </Tooltip>
        </div>
        <div>
          <Tooltip content="开启 DEBUG 模式">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setDebugMode(!isDebugMode)}
              className={isDebugMode ? 'text-primary' : ''}
            >
              <SvgIcon icon={Icon.BUG} size={22} />
            </Button>
          </Tooltip>
          <Tooltip content="断开连接">
            <Button
              isIconOnly
              variant="light"
              color="danger"
              onPress={disconnect}
            >
              <SvgIcon icon={Icon.DISCONNECT} size={22} />
            </Button>
          </Tooltip>
        </div>
      </div>
      <Divider />
      <PanelGroup
        direction="horizontal"
        className="flex w-full grow"
        autoSaveId="channel-attach"
      >
        <Panel minSize={20} defaultSize={40} className="!overflow-y-scroll">
          <ArthasResponseList
            isDebugMode={isDebugMode}
            responses={messages}
            onEntitySelect={setSelectedEntity}
          />
        </Panel>
        <PanelResizeHandle className="bg-default-200 border-default-100 border-l-1" />
        <Panel minSize={30} defaultSize={60}>
          <ArthasResponseDetail entity={selectedEntity} />
        </Panel>
      </PanelGroup>
      <CommandExecuteBlock
        onExecute={launchPullResultTask}
        channelId={props.channelId}
        inputStatus={inputStatus}
      />
    </div>
  )
}

export default ArthasInteractionPage
