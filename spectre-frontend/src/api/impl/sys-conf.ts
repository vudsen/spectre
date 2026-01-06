import axios from 'axios'

export const queryCurrentInitStep = (): Promise<string> =>
  axios.get('/sys-conf/1')

export const updateTourStep = (step: number) =>
  axios.post(`/sys-conf/tour?step=${step}`)
