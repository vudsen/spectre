import axios from 'axios'

type RoleBind = {
  roleId: string
  userIds: string[]
}

export type RolePo = {
  id?: string
  name: string
  description?: string
}


export const bindRoleToUser = (vo: RoleBind) => {
  return axios.post('role/bind-user', vo)
}

export const createRole = (role: RolePo) => {
  return axios.post('role/create', role)
}
