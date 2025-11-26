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
