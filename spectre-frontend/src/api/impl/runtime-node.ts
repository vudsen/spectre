import axios from 'axios'
import type { PageDescriptor } from '@/api/types.ts'

export type RuntimeNodeDTO = {
  id: string
  name: string
  pluginId: string
  configuration: string
  labels: Record<string, string>
  createdAt: number
  restrictedMode: boolean
}

type RuntimeNodeCreateVO = Partial<Omit<RuntimeNodeDTO, 'configuration'>> & {
  configuration: unknown
}

export const createRuntimeNode = (
  vo: RuntimeNodeCreateVO,
): Promise<string | undefined> => {
  return axios.post('/runtime-node/create', {
    ...vo,
    configuration: JSON.stringify(vo.configuration),
  })
}

type RuntimeNodeUpdateVO = Partial<Omit<RuntimeNodeDTO, 'configuration'>> & {
  configuration: unknown
}

export const updateRuntimeNode = (vo: RuntimeNodeUpdateVO) => {
  return axios.post('/runtime-node/update', {
    ...vo,
    configuration: JSON.stringify(vo.configuration),
  })
}

/**
 * 测试连接
 * @param pluginId 插件id
 * @param configuration 配置
 * @param runtimeNodeId 运行节点id，若提供该值，则会在后台将配置合并后再进行测试
 */
export const testConnection = (
  pluginId: string,
  configuration: unknown,
  runtimeNodeId?: string,
): Promise<string | undefined> => {
  return axios.post('/runtime-node/test', {
    pluginId,
    runtimeNodeId,
    configuration: JSON.stringify(configuration),
  })
}

export type JvmTreeNodeDTO = {
  id: string
  name: string
  isJvm: boolean
}

export const expandTree = (
  runtimeNodeId: string,
  parentNodeId?: string,
): Promise<JvmTreeNodeDTO[]> => {
  return axios.post('/runtime-node/expand-tree', {
    runtimeNodeId,
    parentNodeId,
  })
}

export const deleteRuntimeNode = (id: string) => {
  return axios.post(`/runtime-node/delete/${id}`)
}

export const viewRuntimeNode = (id: string): Promise<PageDescriptor> => {
  return axios.get(`/runtime-node/view?runtimeNodeId=${id}`)
}
