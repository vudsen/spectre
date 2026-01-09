import Header from '@/pages/channel/[channelId]/Header.tsx'
import Toolbar from '@/pages/channel/[channelId]/Toolbar.tsx'
import ChannelContext, {
  useChannelContext,
} from '@/pages/channel/[channelId]/context.ts'
import TabsController from '@/pages/channel/[channelId]/_tabs/TabsController.tsx'
import ChannelSvgSymbols from '@/pages/channel/[channelId]/_channel_icons/svg-symbols.tsx'

interface ChannelLayoutProps {
  channelId: string
  appName: string
}

const ChannelLayout: React.FC<ChannelLayoutProps> = (props) => {
  const context = useChannelContext()
  return (
    <ChannelContext value={context}>
      <ChannelSvgSymbols />
      <div>
        <Header {...props} />
        <div className="flex">
          <Toolbar />
          <TabsController />
        </div>
      </div>
    </ChannelContext>
  )
}
export default ChannelLayout
