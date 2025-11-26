import type { ArthasResponse } from '@/api/impl/arthas.ts'
import type React from 'react'
import { Chip, type ChipProps, Tooltip } from '@heroui/react'

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
        color: 'warning',
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
        color: 'success',
        tag: '版本',
      }
      break
    }
    case 'status': {
      state = {
        name: entity.message ?? '成功',
        color: entity.statusCode === 0 ? 'default' : 'danger',
        tag: '命令执行状态',
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
      <Chip color={state.color}>
        <span className="block w-20 text-center">{state.tag}</span>
      </Chip>
      <Tooltip content={state.name} size="lg" delay={200} closeDelay={100}>
        <span className="ml-2 truncate">{state.name}</span>
      </Tooltip>
    </div>
  )
}

export default ArthasResponseDisplay
