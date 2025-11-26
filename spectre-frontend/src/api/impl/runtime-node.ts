import axios from 'axios'

export type RuntimeNodeDTO = {
  id: string
  name: string
  pluginId: string
  configuration: string
  labeles: Record<string, string>
  createdAt: number
}

export const createRuntimeNode = (
  name: string,
  pluginId: string,
  labels: Record<string, string>,
  configuration: unknown,
): Promise<string | undefined> => {
  return axios.post('/runtime-node/create', {
    name,
    pluginId,
    labels,
    configuration: JSON.stringify(configuration),
  })
}

type RuntimeNodeUpdateVO = {
  id: string
  name: string
  labels: Record<string, string>
  pluginId: string
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
