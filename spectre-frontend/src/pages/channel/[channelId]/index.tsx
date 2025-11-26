import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { type ChannelSessionDTO, joinChannel } from '@/api/impl/arthas.ts'
import ArthasInteractionPage from '@/pages/channel/[channelId]/ArthasInteractionPage.tsx'

const ChannelPage: React.FC = () => {
  const params = useParams()
  const channelId = params.channelId
  const [loading, setLoading] = useState(true)
  const [channelJoinMsg, setChannelJoinMsg] = useState<string>()
  const [session, setSession] = useState<ChannelSessionDTO>()

  const doJoinChannel = useCallback((channelId: string) => {
    joinChannel(channelId)
      .then((session) => {
        if (session) {
          setSession(session)
          setLoading(false)
        } else {
          setTimeout(() => {
            doJoinChannel(channelId)
          }, 1000)
        }
      })
      .catch((_) => {
        setChannelJoinMsg('连接到频道失败.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!channelId) {
      setLoading(false)
      setChannelJoinMsg('Channel id is empty!')
      return
    }
    doJoinChannel(channelId)
    const oldVal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = oldVal
    }
  }, [channelId, doJoinChannel])

  if (loading) {
    return <div>Loading...</div>
  } else if (channelJoinMsg) {
    return <div className="text-danger">{channelJoinMsg}</div>
  }
  return (
    <ArthasInteractionPage appName={session!.name} channelId={channelId!} />
  )
}

export default ChannelPage
