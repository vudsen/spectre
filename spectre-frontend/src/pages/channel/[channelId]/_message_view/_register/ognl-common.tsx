import { type DetailComponentProps, registerMessageView } from '../factory.ts'
import OgnlCommonMessageDetail from '../_component/OgnlCommonMessageDetail.tsx'
import type { ArthasResponseWithId } from '@/api/impl/arthas.ts'
import React from 'react'

function createComponent<T extends ArthasResponseWithId>(
  ognlResultGetter: (r: T) => string,
): React.FC<DetailComponentProps<T>> {
  const Component: React.FC<DetailComponentProps<T>> = (props) => {
    return <OgnlCommonMessageDetail raw={ognlResultGetter(props.msg)} />
  }
  return Component
}

type WatchMessage = {
  type: 'watch'
  jobId: number
  accessPoint: string
  className: string
  cost: number
  methodName: string
  sizeLimit: number
  ts: string
  value: string
  fid: number
}

registerMessageView({
  type: 'watch',
  display: (message) => ({
    name: `${message.className}#${message.methodName}`,
    color: 'default',
    tag: 'watch',
  }),
  detailComponent: createComponent<WatchMessage>((msg) => msg.value),
})

type GetStaticMessage = {
  type: 'getstatic'
  jobId: number
  fid: number
  field: string
  fieldName: string
}

registerMessageView({
  type: 'getstatic',
  display: (message) => ({
    name: `查看静态属性: ${message.fieldName}`,
    color: 'default',
    tag: 'getstatic',
  }),
  detailComponent: createComponent<GetStaticMessage>((msg) => msg.field),
})

type OgnlMessage = {
  type: 'ognl'
  jobId: number
  fid: number
  value: string
}
registerMessageView({
  type: 'ognl',
  display: (_) => ({
    name: `执行 Ognl 表达式`,
    color: 'default',
    tag: 'ognl',
  }),
  detailComponent: createComponent<OgnlMessage>((msg) => msg.value),
})
