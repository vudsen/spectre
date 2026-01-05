import axios from 'axios'

export const queryCurrentInitStep = (): Promise<string> =>
  axios.get('/sys-conf/1')
