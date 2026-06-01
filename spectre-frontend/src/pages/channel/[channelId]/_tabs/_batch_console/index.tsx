import React, { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import BatchArthasResponseListTab from '@/pages/channel/[channelId]/_tabs/_batch_console/BatchArthasResponseListTab.tsx'
import BatchArthasResponseDetailTab from '@/pages/channel/[channelId]/_tabs/_batch_console/BatchArthasResponseDetailTab.tsx'
import CommandExecuteBlock from '@/pages/channel/[channelId]/_tabs/_console/CommandExecuteBlock.tsx'

const BatchConsoleTab: React.FC = () => {
  const [groupIndex, setGroupIndex] = useState<number>()
  return (
    <div className="flex h-full">
      <div className="z-10 flex h-full w-0 grow flex-col">
        <PanelGroup
          direction="horizontal"
          className="flex h-0! w-full grow"
          autoSaveId="batch-channel-attach"
        >
          <Panel minSize={20} defaultSize={40}>
            <BatchArthasResponseListTab
              onSelect={setGroupIndex}
            ></BatchArthasResponseListTab>
          </Panel>
          <PanelResizeHandle className="bg-default-200 border-default-100 border-l-1" />
          <Panel minSize={20} defaultSize={40}>
            <BatchArthasResponseDetailTab groupIndex={groupIndex} />
          </Panel>
        </PanelGroup>
        <CommandExecuteBlock />
      </div>
    </div>
  )
}

export default BatchConsoleTab
