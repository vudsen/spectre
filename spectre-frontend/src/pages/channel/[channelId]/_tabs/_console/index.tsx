import React, { useState } from 'react'
import { type ArthasResponseWithId } from '@/api/impl/arthas.ts'
import { Divider } from '@heroui/react'
import ArthasResponseDetailTab from './ArthasResponseDetailTab.tsx'
import CommandExecuteBlock from './CommandExecuteBlock.tsx'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ArthasResponseListTab from './ArthasResponseListTab.tsx'

const ConsoleTab: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<ArthasResponseWithId>()

  return (
    <div className="flex h-full">
      <div className="z-10 flex h-full w-0 grow flex-col">
        <Divider />
        <PanelGroup
          direction="horizontal"
          className="flex h-0! w-full grow"
          autoSaveId="channel-attach"
        >
          <Panel minSize={20} defaultSize={40}>
            <ArthasResponseListTab onEntitySelect={setSelectedEntity} />
          </Panel>
          <PanelResizeHandle className="bg-default-200 border-default-100 border-l-1" />
          <Panel minSize={30} defaultSize={60}>
            <ArthasResponseDetailTab entity={selectedEntity} />
          </Panel>
        </PanelGroup>
        <CommandExecuteBlock />
      </div>
    </div>
  )
}

export default ConsoleTab
