import React, { useCallback, useContext } from 'react'
import type { DetailComponentProps } from '../factory.ts'
import Code from '@/components/Code.tsx'
import { Link } from '@heroui/react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'
import i18n from '@/i18n'

export type JadMessage = {
  classInfo: {
    classLoaderHash: string
    classloader: string[]
    name: string
  }
  jobId: number
  location: string
  mappings: Record<string, number>
  source: string
  type: 'jad'
}

const JadMessageDetail: React.FC<DetailComponentProps<JadMessage>> = (
  props,
) => {
  const context = useContext(ChannelContext)
  const goJadTab = useCallback(() => {
    context.getTabsController().openTab(
      'JAD',
      {},
      {
        classname: props.msg.classInfo.name,
        loaded: props.msg,
      },
    )
  }, [context, props.msg])
  return (
    <>
      <div className="bg-success-100 flex justify-between p-2 text-sm">
        <span>
          {i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_component_jadmessagedetail_001',
          )}
        </span>
        <Link
          color="primary"
          size="sm"
          onPress={goJadTab}
          className="cursor-pointer"
        >
          {i18n.t(
            'hardcoded.msg_pages_channel_param_message_view_component_jadmessagedetail_002',
          )}
        </Link>
      </div>
      <Code code={props.msg.source} />
    </>
  )
}

export default JadMessageDetail
