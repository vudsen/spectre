import i18n from '@/i18n'
export type ToolchainItemType = {
  name: string
  type: string
  description: string
  urlGuide: string
  url: string
  hasMultiplatformBundle: boolean
}

const toolchainTypes: ToolchainItemType[] = [
  {
    name: 'Arthas',
    description: i18n.t(
      'hardcoded.msg_pages_toolchain_items_toolchainitemtype_001',
    ),
    type: 'ARTHAS',
    urlGuide: i18n.t(
      'hardcoded.msg_pages_toolchain_items_toolchainitemtype_002',
    ),
    url: 'https://github.com/alibaba/arthas/releases',
    hasMultiplatformBundle: false,
  },
  {
    name: 'Jattach',
    description: i18n.t(
      'hardcoded.msg_pages_toolchain_items_toolchainitemtype_003',
    ),
    type: 'JATTACH',
    urlGuide: i18n.t(
      'hardcoded.msg_pages_toolchain_items_toolchainitemtype_004',
    ),
    url: 'https://github.com/jattach/jattach/releases',
    hasMultiplatformBundle: true,
  },
]

export default toolchainTypes
