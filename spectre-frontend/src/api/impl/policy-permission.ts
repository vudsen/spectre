import axios from 'axios'
import type { PageDescriptor } from '@/api/types.ts'

type PermissionEntity = {
  resource: string
  action: string
  name: string
}

export const listAllPolicyPermissions = (): Promise<PermissionEntity[]> => {
  return axios.get('permission/policy/permissions')
}
export type PolicyPermissionEnhancePlugin = {
  pluginId: string
  configuration: string
}

type SavePolicyPermission = {
  subjectType: string
  subjectId: string
  resource: string
  action: string
  conditionExpression: string
  description?: string | null
  enhancePlugins: PolicyPermissionEnhancePlugin[]
}

export const createPolicyPermission = (policy: SavePolicyPermission) => {
  return axios.post('permission/policy/create', policy)
}

type UpdateArgs = {
  id: string
  conditionExpression: string
  description?: string | null
  enhancePlugins: PolicyPermissionEnhancePlugin[]
}

export const updatePolicyPermission = (policy: UpdateArgs) => {
  return axios.post('permission/policy/update', policy)
}

export const getEnhanceAuthenticationPages = (
  resource: string,
  action: string,
): Promise<PageDescriptor[]> => {
  return axios.get(
    `permission/policy/enhance-pages?resource=${resource}&action=${action}`,
  )
}

export const deletePermissionPolicy = (id: string) => {
  return axios.post(`permission/policy/delete/${id}`)
}

export type PolicyPermissionContextExample = {
  name: string
  context: Record<string, unknown>
}

export const getPolicyPermissionContextExample = (
  resource: string,
  action: string,
): Promise<PolicyPermissionContextExample[]> =>
  axios.get(`permission/policy/example?resource=${resource}&action=${action}`)
