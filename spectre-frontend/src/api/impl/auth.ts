import axios from 'axios'

/**
 * 登录
 * @return {Promise<string>} 用户id
 */
export const login = (username: string, password: string): Promise<string> => {
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
