import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ArthasResponseWithId,
  type InputStatusResponse,
  pullResults,
} from '@/api/impl/arthas.ts'
import { Divider } from '@heroui/react'
import ArthasResponseDetailTab from './ArthasResponseDetailTab.tsx'
import { isErrorResponse } from '@/api/types.ts'
import { handleError, showDialog } from '@/common/util.ts'
import CommandExecuteBlock from './CommandExecuteBlock.tsx'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ArthasResponseListTab from './ArthasResponseListTab.tsx'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { appendMessages, clearExpiredMessages } from '@/store/channelSlice'
import './_message_view/init.ts'

const Index: React.FC = () => {
  const channelId = useSelector<RootState, string>(
    (state) => state.channel.context.channelId,
  )
  const messages = useSelector<RootState, ArthasResponseWithId[]>(
    (state) => state.channel.messages[state.channel.context.channelId] ?? [],
  )
  const dispatch = useDispatch()
  const [inputStatus, setInputStatus] = useState<
    InputStatusResponse['inputStatus']
  >(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.type === 'input_status') {
        return (msg as InputStatusResponse).inputStatus
      }
    }
    return 'DISABLED'
  })
  const [selectedEntity, setSelectedEntity] = useState<ArthasResponseWithId>()
  const pullResultsTaskId = useRef<number>(undefined)
  const taskDelay = useRef(0)
  const isExcited = useRef(false)
  const isFetching = useRef(false)

  const doPullResults = useCallback(async (): Promise<number> => {
    try {
      const r = await pullResults(channelId)
      for (const resp of r) {
        if (resp.type === 'input_status') {
          setInputStatus((resp as InputStatusResponse).inputStatus)
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
  }, [channelId, dispatch])

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
  }, [dispatch, launchPullResultTask, channelId])

  return (
    <div className="flex h-full">
      <div className="z-10 flex h-full w-0 grow flex-col">
        <Divider />
        <PanelGroup
          direction="horizontal"
          className="flex h-0! w-full grow"
          autoSaveId="channel-attach"
        >
          <Panel minSize={20} defaultSize={40} className="!overflow-y-scroll">
            <ArthasResponseListTab
              responses={messages}
              onEntitySelect={setSelectedEntity}
            />
          </Panel>
          <PanelResizeHandle className="bg-default-200 border-default-100 border-l-1" />
          <Panel minSize={30} defaultSize={60}>
            <ArthasResponseDetailTab entity={selectedEntity} />
          </Panel>
        </PanelGroup>
        <CommandExecuteBlock
          onExecute={launchPullResultTask}
          channelId={channelId}
          inputStatus={inputStatus}
        />
      </div>
    </div>
  )
}

export default Index
