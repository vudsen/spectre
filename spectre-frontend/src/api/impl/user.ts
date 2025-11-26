import axios from 'axios'

export type UserPO = {
  id?: string
  username: string
  password?: string
  displayName?: string | null
  labels?: Record<string, string>
}

export const createUser = (po: UserPO) => {
  return axios.post('/user/create', po)
}

type UpdateUserVO = {
  id: string
  displayName?: string | null
  labels?: Record<string, string>
}

export const updateUser = (po: UpdateUserVO) => {
  return axios.post('/user/update', po)
}

export type ModifyPasswordVO = {
  oldPassword: string
  newPassword: string
}

export const modifyPassword = (vo: ModifyPasswordVO) => {
  return axios.post('/user/modify-password', vo)
}

export type ModifyUserPasswordVO = {
  userId: string
  newPassword: string
}

export const modifyUserPassword = (vo: ModifyUserPasswordVO) => {
  return axios.post('/user/modify-user-password', vo)
}
