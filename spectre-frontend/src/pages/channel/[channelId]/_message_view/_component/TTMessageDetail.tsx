import type { DetailComponentProps } from '@/pages/channel/[channelId]/_message_view/factory.ts'
import OgnlMessageView from '@/pages/channel/[channelId]/_message_view/_component/_ognl_result/OgnlMessageView.tsx'
import {
  ListboxItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import PackageHider from '@/pages/channel/[channelId]/_message_view/_component/_common/PackageHider.tsx'
import RightClickMenu from '@/components/RightClickMenu/RightClickMenu.tsx'
import useRightClickMenu from '@/components/RightClickMenu/useRightClickMenu.ts'
import React, { useContext, useRef } from 'react'
import ChannelContext from '@/pages/channel/[channelId]/context.ts'

type TimeFragment = {
  className: string
  cost: number
  index: number
  methodName: string
  object: string
  params: string[]
  return: boolean
  returnObj: string
  throw: boolean
  throwExp: string
  timestamp: string
}

type TTMessage = {
  type: 'tt'
  first: boolean
  jobId: number
  timeFragmentList?: TimeFragment[]
  timeFragment?: TimeFragment
  watchValue?: string
}

const TimeFragmentListDisplay: React.FC<{
  timeFragmentList: TimeFragment[]
}> = ({ timeFragmentList }) => {
  const { onContextMenu, menuProps } = useRightClickMenu()
  const context = useContext(ChannelContext)
  const selectedFragment = useRef<TimeFragment>(null)

  const onContextMenu0 = (
    fragment: TimeFragment,
    e: React.MouseEvent<unknown>,
  ) => {
    selectedFragment.current = fragment
    onContextMenu(e)
  }

  const onAction = () => {
    context.getQuickCommandExecutor().open('tt', {
      index: selectedFragment.current!.index,
    })
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableColumn>INDEX</TableColumn>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>METHOD</TableColumn>
          <TableColumn>IS-RET</TableColumn>
          <TableColumn>IS-EXP</TableColumn>
          <TableColumn>COST(ms)</TableColumn>
          <TableColumn>OBJECT</TableColumn>
          <TableColumn>TIMESTAMP</TableColumn>
        </TableHeader>
        <TableBody>
          {timeFragmentList.map((fragment) => (
            <TableRow
              key={fragment.index}
              onContextMenu={(e) => onContextMenu0(fragment, e)}
            >
              <TableCell>{fragment.index}</TableCell>
              <TableCell>
                <PackageHider classname={fragment.className} />
              </TableCell>
              <TableCell>{fragment.methodName}</TableCell>
              <TableCell>{fragment.return.toString()}</TableCell>
              <TableCell>{fragment.throwExp.toString()}</TableCell>
              <TableCell>{fragment.cost}</TableCell>
              <TableCell>{fragment.object}</TableCell>
              <TableCell>{fragment.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="text-default-500 my-3 text-right text-sm">
        提示: 右键可以进行额外操作
      </div>
      <RightClickMenu {...menuProps} onAction={onAction}>
        <ListboxItem key="tt">执行表达式</ListboxItem>
      </RightClickMenu>
    </div>
  )
}

const TTMessageDetail: React.FC<DetailComponentProps<TTMessage>> = ({
  msg,
}) => {
  if (msg.watchValue) {
    return <OgnlMessageView raw={msg.watchValue} />
  } else if (msg.timeFragmentList) {
    return <TimeFragmentListDisplay timeFragmentList={msg.timeFragmentList} />
  } else if (msg.timeFragment) {
    return <TimeFragmentListDisplay timeFragmentList={[msg.timeFragment]} />
  }
}
export default TTMessageDetail
