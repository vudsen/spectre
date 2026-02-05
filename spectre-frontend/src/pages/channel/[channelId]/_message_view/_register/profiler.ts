import { registerMessageView } from '../factory.ts'
import ProfilerMessageDetail from '../_component/ProfilerMessageDetail.tsx'

registerMessageView({
  detailComponent: ProfilerMessageDetail,
  type: 'profiler',
  display: (_) => ({
    name: 'Profiler',
    tabName: 'Profiler',
  }),
})
