import axios from 'axios'

type RoleBind = {
  roleId: string
  userIds: string[]
}

export type RoleModifyVO = {
  id?: string
  name: string
  description?: string | null
}

export const bindRoleToUser = (vo: RoleBind) => {
  return axios.post('role/bind-user', vo)
}

export const createRole = (role: RoleModifyVO) => {
  return axios.post('role/create', role)
}

export const updateRole = (role: RoleModifyVO) => {
  return axios.post('role/update', role)
}
