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
    description: '基础工具包',
    type: 'ARTHAS',
    urlGuide: '链接应该指向 arthas-bin.zip',
    url: 'https://github.com/alibaba/arthas/releases',
    hasMultiplatformBundle: false,
  },
  {
    name: 'Jattach',
    description: '用于兼容 jre 环境',
    type: 'JATTACH',
    urlGuide: '链接应该指向对应系统的 jattach 文件',
    url: 'https://github.com/jattach/jattach/releases',
    hasMultiplatformBundle: true,
  },
  {
    name: 'HttpClient',
    description: '一个简单的 http 客户端，用于和 arthas http endpoint 交互',
    type: 'HTTP_CLIENT',
    urlGuide: '链接应该指向对应的 jar 包',
    url: '',
    hasMultiplatformBundle: false,
  },
]

export default toolchainTypes
