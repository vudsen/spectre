import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import React, { useMemo, useState } from 'react'
import Time from '@/components/Time.tsx'

type Trace = {
  fileName: string
  lineNumber: number
  className: string
  methodName: string
}

type StackMessage = {
  type: 'stack'
  threadId: number
  threadName: string
  ts: string
  classloader: string
  cost: number
  daemon: boolean
  jobId: number
  priority: number
  stackTrace: Trace[]
}

type KV = {
  name: string
  value: React.ReactNode
}

interface PackageHiderProps {
  trace: Trace
}

type ClassInfo = {
  package: string
  lightPackage: string
  classname: string
}

const PackageHider: React.FC<PackageHiderProps> = ({ trace }) => {
  const [lightMode, setLightMode] = useState(true)
  const info: ClassInfo = useMemo(() => {
    const packageCharacters: string[] = []
    const pkgs = trace.className.split('.')
    for (let i = 0; i < pkgs.length - 1; i++) {
      if (i === 1) {
        // usually company name
        packageCharacters.push(pkgs[i])
      } else {
        packageCharacters.push(pkgs[i].charAt(0))
      }
    }
    return {
      classname: pkgs[pkgs.length - 1],
      package: trace.className.substring(0, trace.className.lastIndexOf('.')),
      lightPackage: packageCharacters.join('.'),
    }
  }, [trace.className])

  return (
    <>
      {lightMode ? (
        <span
          className="cursor-pointer bg-green-100"
          onClick={() => setLightMode(false)}
        >
          {info.lightPackage}
        </span>
      ) : (
        <span>{info.package}</span>
      )}
      <span>.{info.classname}</span>
    </>
  )
}

const StackMessageDetail: React.FC<DetailComponentProps<StackMessage>> = ({
  msg,
}) => {
  const keyValues: KV[] = useMemo(
    () => [
      {
        name: 'ID',
        value: msg.threadId,
      },
      {
        name: 'Time',
        value: <Time time={msg.ts} />,
      },
      {
        name: 'Daemon',
        value: msg.daemon.toString(),
      },
    ],
    [msg],
  )

  return (
    <div className="inline-block">
      <div>
        <span className="font-bold">{msg.threadName} (</span>
        {keyValues.map((kv, index) => (
          <span key={kv.name}>
            {index !== 0 ? <span>; </span> : null}
            <span>{kv.name}</span>
            <span> = </span>
            <span className="text-default-500">{kv.value}</span>
          </span>
        ))}
        <span>)</span>
      </div>
      <div className="text-default-600 ml-4 inline-block w-auto text-sm">
        {msg.stackTrace.map((trace) => (
          <div
            className="my-0.5"
            key={`${trace.className}#${trace.methodName}:${trace.lineNumber}`}
          >
            <PackageHider trace={trace} />#
            <span className="text-default-500">{trace.methodName}</span>:
            <span className="text-default-400">{trace.lineNumber}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StackMessageDetail
