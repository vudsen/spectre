import React, { useEffect, useState } from 'react'
import { executeArthasCommandSync } from '@/api/impl/arthas.ts'
import { store } from '@/store'
import { addToast } from '@heroui/react'

export interface JadPageProps {
  classname: string
}

type JadMessage = {
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

const JadPage: React.FC<JadPageProps> = (props) => {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<undefined | string>()

  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
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
        setMessages(jadMsg.source.split('\n'))
        setLoading(false)
      })
      .catch((e) => {
        setErrorMessage(`反编译失败: ${e.message ?? '未知原因'}`)
      })
  }, [props.classname])

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

  return (
    <div className="overflow-scroll">
      <code className="block font-mono text-sm leading-6 whitespace-pre text-gray-800 [counter-reset:line]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="before:mr-4 before:inline-block before:w-10 before:text-right before:text-gray-600 before:content-[counter(line)] before:select-none before:[counter-increment:line]"
          >
            {msg}
          </div>
        ))}
      </code>
    </div>
  )
}

export default JadPage
