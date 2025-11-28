import type { ArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'
import { type ChipProps, Tooltip } from '@heroui/react'
import clsx from 'clsx'

interface ArthasResponseDisplayProps {
  entity: ArthasResponse
}

type DisplayState = {
  name: string
  color: ChipProps['color']
  tag: string
}

const ArthasResponseDisplay: React.FC<ArthasResponseDisplayProps> = ({
  entity,
}) => {
  let state: DisplayState
  switch (entity.type) {
    case 'welcome': {
      state = {
        name: entity.mainClass,
        color: 'primary',
        tag: '欢迎信息',
      }
      break
    }
    case 'command': {
      state = {
        name: entity.command,
        color: 'primary',
        tag: '执行命令',
      }
      break
    }
    case 'message': {
      state = {
        name: entity.message,
        color: 'secondary',
        tag: '服务器消息',
      }
      break
    }
    case 'input_status': {
      state = {
        name: entity.inputStatus,
        color: 'default',
        tag: '输入状态',
      }
      break
    }
    case 'version': {
      state = {
        name: entity.version,
        color: 'default',
        tag: '版本',
      }
      break
    }
    case 'status': {
      state = {
        name: entity.message ?? '成功',
        color: entity.statusCode === 0 ? 'success' : 'danger',
        tag: entity.statusCode === 0 ? '执行成功' : '执行失败',
      }
      break
    }
    case 'classloader': {
      state = {
        name: '列出所有的类加载器',
        color: 'success',
        tag: '类加载器',
      }
      break
    }
    case 'row_affect': {
      state = {
        name: `影响了 ${entity.rowCount} 个类`,
        color: 'secondary',
        tag: '影响数量',
      }
      break
    }
    case 'watch': {
      state = {
        name: `${entity.className}#${entity.methodName}`,
        color: 'success',
        tag: '观察结果',
      }
      break
    }
    default: {
      state = {
        name: '<Unknown>',
        color: 'default',
        // @ts-expect-error this is safe, no errors.
        tag: entity.type,
      }
      break
    }
  }

  return (
    <div className="flex items-center">
      {/*<Chip variant="flat" color={state.color} size="sm">*/}
      {/*  <span className="block w-24 text-center text-sm">{state.tag}</span>*/}
      {/*</Chip>*/}
      <div className="border-r-divider h-full border-r-2 text-center italic">
        <span
          className={clsx('block w-24 text-sm italic', {
            'text-danger': state.color === 'danger',
            'text-primary': state.color === 'primary',
            'text-success': state.color === 'success',
          })}
        >
          {state.tag}
        </span>
      </div>
      <Tooltip content={state.name} size="lg" delay={200} closeDelay={100}>
        <span className="text-default-500 ml-2 truncate text-sm">
          {state.name}
        </span>
      </Tooltip>
    </div>
  )
}

export default ArthasResponseDisplay
