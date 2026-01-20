import React, { Fragment, useCallback, useMemo, useState } from 'react'
import {
  type OgnlResult,
  type OgnlResultArray,
  type OgnlResultMap,
  type OgnlResultObject,
  type OgnlResultValue,
  parseOgnlResult,
} from './parser.ts'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import ChannelIcon from '@/pages/channel/[channelId]/_channel_icons/ChannelIcon.ts'
import { Code, Link, Tooltip } from '@heroui/react'
import Icon from '@/components/icon/icon.ts'

const MARGIN_RATE = 24

function Row({ children, level }: React.PropsWithChildren<{ level: number }>) {
  return (
    <div
      className="hover:bg-primary-50 box-border flex cursor-pointer items-center p-2"
      style={{
        paddingLeft: (level - 1) * MARGIN_RATE,
      }}
    >
      {children}
    </div>
  )
}

function ArrayDisplay(props: {
  node: OgnlResultArray
  prefix?: React.ReactNode
  level: number
}) {
  return (
    <>
      <Row {...props}>
        <SvgIcon icon={ChannelIcon.ARRAY} className="mr-1" /> {props.prefix}{' '}
        <span>&nbsp;{props.node.javaType}</span>
      </Row>
      {props.node.values.map((r, index) => (
        <OgnlMessageDisplay
          node={r}
          key={r.fakeId}
          prefix={<span className="text-primary">{index} →&nbsp;</span>}
          level={props.level + 1}
        />
      ))}
    </>
  )
}

function ObjectDisplay(props: {
  node: OgnlResultObject
  prefix?: React.ReactNode
  level: number
}) {
  return (
    <>
      <Row {...props}>
        <SvgIcon icon={ChannelIcon.FIELD} className="mr-1" />
        {props.prefix}
        {props.node.javaType}
      </Row>
      {Object.entries(props.node.entities).map(([name, result]) => (
        <OgnlMessageDisplay
          node={result}
          prefix={<span className="text-primary">{name} =&nbsp;</span>}
          level={props.level + 1}
        />
      ))}
    </>
  )
}

function ValueDisplay(props: {
  node: OgnlResultValue
  prefix?: React.ReactNode
  level: number
}) {
  return (
    <Row {...props}>
      <SvgIcon icon={ChannelIcon.FIELD} className="mr-1" />
      {props.prefix}
      {props.node.javaType ? (
        <>
          <span className="text-default-400">{props.node.javaType}</span>
          <span className="ml-2">{props.node.value}</span>
        </>
      ) : (
        <span className="text-default-400">null</span>
      )}
    </Row>
  )
}

function MapDisplay(props: {
  node: OgnlResultMap
  prefix?: React.ReactNode
  level: number
}) {
  return (
    <>
      <Row {...props}>
        <SvgIcon icon={ChannelIcon.FIELD} className="mr-1" />
        {props.prefix}
        {props.node.javaType}
      </Row>
      {props.node.entities.map(([key, result]) => (
        <OgnlMessageDisplay
          node={result}
          prefix={
            <Fragment>
              <span className="text-default-400">{key.javaType}&nbsp;</span>
              <span className="text-primary">{key.value} =&nbsp;</span>
            </Fragment>
          }
          level={props.level + 1}
        />
      ))}
    </>
  )
}

interface OgnlMessageDisplayProps {
  node: OgnlResult
  prefix?: React.ReactNode
  level: number
}

function OgnlMessageDisplay({ node, prefix, level }: OgnlMessageDisplayProps) {
  switch (node.type) {
    case 'array':
      return <ArrayDisplay node={node} prefix={prefix} level={level} />
    case 'map':
      return <MapDisplay node={node} prefix={prefix} level={level} />
    case 'object':
      return <ObjectDisplay node={node} prefix={prefix} level={level} />
    case 'value':
      return <ValueDisplay node={node} prefix={prefix} level={level} />
  }
}

interface OgnlMessageViewProps {
  raw: string
}

const OgnlMessageView: React.FC<OgnlMessageViewProps> = ({ raw }) => {
  const node = useMemo(() => parseOgnlResult(raw), [raw])
  const [useOriginal, setOriginal] = useState(false)

  const toggle = useCallback(() => {
    setOriginal((prv) => !prv)
  }, [])

  return (
    <>
      {useOriginal ? (
        <Code className="w-full whitespace-pre-wrap">{raw}</Code>
      ) : (
        <OgnlMessageDisplay node={node} level={1} />
      )}

      <Link
        color="foreground"
        underline="always"
        className="mt-5 cursor-pointer"
        size="sm"
        onPress={toggle}
      >
        {useOriginal ? '显示解析后视图' : '显示原始内容'}
        <Tooltip content="解析后的视图小概率会出现 BUG(例如字段丢失/错乱)，因此暂时留一个回退按钮">
          <SvgIcon icon={Icon.QUESTION} />
        </Tooltip>
      </Link>
    </>
  )
}

export default OgnlMessageView
