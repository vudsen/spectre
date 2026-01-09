import React from 'react'
import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import { Tab, Tabs } from '@heroui/react'
import ArthasResponseDetail from './_message_view/ArthasResponseDetail.tsx'

interface ArthasResponseDetailProps {
  entity?: ArthasResponseWithId
}

const ArthasResponseDetailTab: React.FC<ArthasResponseDetailProps> = ({
  entity,
}) => {
  if (!entity) {
    return (
      <div className="m-3 text-sm select-none">
        <div>点击左侧任意一项查看详细</div>
        <div className="text-secondary">
          Tips: 拖动中间的竖线可以调整窗口大小!
        </div>
      </div>
    )
  }
  return (
    <div className="box-border flex h-full flex-col">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        classNames={{ panel: 'overflow-scroll p-3 pb-8 grow' }}
      >
        <Tab title="视图">
          <ArthasResponseDetail message={entity} />
        </Tab>
        <Tab title="原始内容">
          <div className="text-default-700 bg-default-100 mx-3 box-border rounded-xl p-3 text-sm whitespace-pre-wrap">
            {JSON.stringify(entity, null, 2)}
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}

export default ArthasResponseDetailTab
