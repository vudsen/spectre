import axios from 'axios'

export type UserDTO = {
  id: string
  username: string
  displayName?: string
  labels: Record<string, string>
  createdAt: string
}

/**
 * 登录
 * @return {Promise<string>} 用户id
 */
export const login = (username: string, password: string): Promise<UserDTO> => {
  return axios.post(
    '/auth/login',
    {
      username,
      password,
    },
    {
      meta: {
        skipErrorHandler: true,
      },
    },
  )
}

export const logout = () => {
  return axios.post('/logout')
}
