import React, { useCallback, useContext } from 'react'
import type { DetailComponentProps } from '../factory.ts'
import Code from '@/components/Code.tsx'
import { Link } from '@heroui/react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'

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
  fid: number
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
        <span>Jad 支持在标签页中查看</span>
        <Link
          color="primary"
          size="sm"
          onPress={goJadTab}
          className="cursor-pointer"
        >
          在标签页中查看
        </Link>
      </div>
      <Code code={props.msg.source} />
    </>
  )
}

export default JadMessageDetail
