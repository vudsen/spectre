import React, { useContext } from 'react'
import { Tab, Tabs, Tooltip } from '@heroui/react'
import ArthasResponseDetail from '@/pages/channel/[channelId]/_message_view/ArthasResponseDetail.tsx'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import type { ArthasMessage } from '@/pages/channel/[channelId]/db.ts'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import i18n from '@/i18n'

interface ArthasResponseDetailProps {
  entity?: ArthasMessage
}

const ArthasResponseDetailTab: React.FC<ArthasResponseDetailProps> = ({
  entity,
}) => {
  const context = useContext(ChannelContext)
  if (!entity) {
    return (
      <div className="m-3 text-sm select-none">
        <div>
          {i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_001',
          )}
        </div>
        <div className="text-secondary">
          {i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_002',
          )}
        </div>
      </div>
    )
  }
  const openInNewTab = () => {
    context
      .getTabsController()
      .openTab(
        'MESSAGE_DETAIL',
        { name: entity.context.command, icon: ChannelIcon.ALIGN_LEFT },
        { msg: entity },
      )
  }
  return (
    <div className="relative box-border flex h-full flex-col">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        classNames={{
          panel: 'overflow-scroll grow p-0',
          cursor: 'w-full',
          base: '',
          tab: 'max-w-fit',
          tabList: ' w-full relative rounded-none p-2 border-b border-divider',
        }}
      >
        <Tab
          title={i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_003',
          )}
        >
          <ArthasResponseDetail message={entity} />
        </Tab>
        <Tab
          title={i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_004',
          )}
        >
          <div className="text-default-700 bg-default-100 mx-3 box-border rounded-xl p-3 text-sm whitespace-pre-wrap">
            {JSON.stringify(entity, null, 2)}
          </div>
        </Tab>
      </Tabs>
      <div className="absolute top-3.5 right-5">
        <Tooltip
          content={i18n.t(
            'hardcoded.msg_pages_channel_param_tabs_console_arthasresponsedetailtab_005',
          )}
        >
          <SvgIcon
            onClick={openInNewTab}
            icon={Icon.EXTERNAL}
            className="text-primary cursor-pointer"
          />
        </Tooltip>
      </div>
    </div>
  )
}

export default ArthasResponseDetailTab
