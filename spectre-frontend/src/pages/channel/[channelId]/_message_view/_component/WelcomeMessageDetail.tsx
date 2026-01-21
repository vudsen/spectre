import { Code, Link } from '@heroui/react'
import type React from 'react'
import type { DetailComponentProps } from '../factory.ts'

type WelcomeMessage = {
  type: 'welcome'
  jobId: number
  mainClass: string
  pid: string
  time: string
  tutorials: string
  version: string
  wiki: string
  fid: number
}

const WelcomeMessageDetail: React.FC<DetailComponentProps<WelcomeMessage>> = (
  props,
) => {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-primary font-bold">欢迎使用 Arthas!</div>
      <div>
        版本: <Code>{props.msg.version}</Code>
      </div>
      <div>
        主类: <Code style={{ textWrap: 'wrap' }}>{props.msg.mainClass}</Code>
      </div>
      <div className="flex">
        <Link href={props.msg.wiki} isExternal size="sm">
          Wiki
        </Link>
        <Link href={props.msg.tutorials} isExternal className="ml-2" size="sm">
          教程
        </Link>
      </div>
    </div>
  )
}

export default WelcomeMessageDetail
