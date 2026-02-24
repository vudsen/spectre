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

type UpdateToolchainBundleDTO = {
  id: string
  name?: string
  jattachTag?: string
  arthasTag?: string
}

export const updateToolchainBundle = (po: UpdateToolchainBundleDTO) => {
  return axios.post('toolchain/bundle/update', po)
}

type ToolchainItemDTO = {
  type: string
  tag: string
  url: string
  armUrl?: string
}

export const saveToolchainItem = (dto: ToolchainItemDTO) => {
  return axios.post('toolchain/item/save', dto)
}

type CreateToolchainBundleDTO = {
  name: string
  jattachTag: string
  arthasTag: string
}

export const createToolchainBundle = (dto: CreateToolchainBundleDTO) => {
  return axios.post('toolchain/bundle/create', dto)
}
