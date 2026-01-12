import React, { useEffect, useState } from 'react'
import { executeArthasCommandSync } from '@/api/impl/arthas.ts'
import { store } from '@/store'
import { addToast } from '@heroui/react'
import Code from '@/components/Code.tsx'
import type { JadMessage } from '@/pages/channel/[channelId]/_tabs/_console/_message_view/_component/JadMessageDetail.tsx'

export interface JadPageProps {
  /**
   * 如果提供该值，则不好发送请求进行反编译
   */
  loaded?: JadMessage
  classname: string
}

const JadPage: React.FC<JadPageProps> = (props) => {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<undefined | string>()

  const [code, setCode] = useState<string | undefined>(props.loaded?.source)

  useEffect(() => {
    if (code) {
      setLoading(false)
      return
    }
    const channelId = store.getState().channel.context.channelId
    executeArthasCommandSync(channelId, `jad ${props.classname}`)
      .then((r) => {
        let jadMsg: JadMessage | undefined
        for (const rElement of r) {
          if (rElement.type === 'jad') {
            jadMsg = rElement as JadMessage
          }
        }
        if (!jadMsg) {
          addToast({
            title: '反编译失败',
            color: 'danger',
          })
          // TODO setErrorMessage
          console.log(r)
          return
        }
        setCode(jadMsg.source)
        setLoading(false)
      })
      .catch((e) => {
        setErrorMessage(`反编译失败: ${e.message ?? '未知原因'}`)
      })
  }, [code, props.classname])

  if (errorMessage) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-danger">{errorMessage}</span>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="animate-pulse">加载中</span>
      </div>
    )
  }

  return <Code code={code} />
}

export default JadPage
