import axios from 'axios'

export type PermissionResourceDTO = {
  name: string
  resource: string
}

export const listStaticPermissionNames = (): Promise<
  PermissionResourceDTO[]
> => {
  return axios.get('permission/static/resources')
}

type StaticPermissionModifyVO = {
  subjectId: string
  subjectType: string
  resource: string
  action: string
  enabled: boolean
}

export const saveStaticPermissions = (
  modifications: StaticPermissionModifyVO[],
) => {
  return axios.post('permission/static/save-all', modifications)
}
