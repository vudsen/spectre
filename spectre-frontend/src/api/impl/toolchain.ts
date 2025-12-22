import axios from 'axios'

type DeleteToolchainItemVO = {
  type: string
  tag: string
}

export const deleteToolchainItem = (vo: DeleteToolchainItemVO) => {
  return axios.post('toolchain/item/delete', {
    type: vo.type,
    tag: vo.tag,
  })
}

export const deleteToolchainBundle = (id: string) => {
  return axios.post(`toolchain/bundle/delete?id=${id}`)
}
