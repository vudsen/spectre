import SingleChannelCreate from '@/pages/channel/SingleChannelCreate.tsx'
import BatchChannelCreate from '@/pages/channel/BatchChannelCreate.tsx'
import i18n from 'i18next'

/**
 * 连接到 jvm 的加载界面
 */
const AttachPage = () => {
  const searchParams = new URLSearchParams(location.search)
  const treeNodeId = searchParams.get('treeNodeId')
  const bundleId = searchParams.get('bundleId')
  const runtimeNodeId = searchParams.get('runtimeNodeId')
  const batch = searchParams.get('batch')

  if (treeNodeId && bundleId && runtimeNodeId) {
    return (
      <SingleChannelCreate
        treeNodeId={treeNodeId}
        runtimeNodeId={runtimeNodeId}
        bundleId={bundleId}
      />
    )
  } else if (batch) {
    return <BatchChannelCreate channels={JSON.parse(batch)} />
  } else {
    return <div>{i18n.t('hardcoded.msg_pages_channel_index_007')}</div>
  }
}

export default AttachPage
