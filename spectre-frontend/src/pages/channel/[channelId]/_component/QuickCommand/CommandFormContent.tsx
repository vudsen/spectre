import { useContext } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { InputStatusResponse } from '@/api/impl/arthas.ts'
import ChannelContext, {
  type ChannelContextState,
} from '@/pages/channel/[channelId]/context.ts'
import { useForm, type Path, type FieldValues } from 'react-hook-form'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react'
import ControlledInput from '@/components/validation/ControlledInput.tsx'

type AnyValues = FieldValues

type FormItem<T extends AnyValues> = {
  type?: 'text' | 'number'
  name: Path<T>
  label: string
  isRequired?: boolean
}

type ExecutionContext<T> = {
  channelContext: ChannelContextState
  values: T
}

/**
 * 自定义表单。{@link FormHandle#buildCommand} 和 {@link FormHandle#execute} 必须指定一个
 */
export type FormHandle<T extends AnyValues> = {
  /**
   * 使用数组时会在一行显示
   */
  items: (FormItem<T> | FormItem<T>[])[]
  /**
   * 构建命令
   */
  buildCommand?: (values: T) => string
  /**
   * 替换默认的执行行为.
   */
  execute?: (context: ExecutionContext<T>) => void
  defaultValues?: Partial<T>
  name: string
  /**
   * 表示该命令是同步命令，不会中断当前命令
   */
  isSync?: boolean
}

interface CommandFormContentProps<T extends AnyValues> {
  handle: FormHandle<T>
  defaultValues: Partial<T>
  onClose: () => void
}

export default function CommandFormContent<T extends AnyValues>({
  handle,
  defaultValues,
  onClose,
}: CommandFormContentProps<T>) {
  const inputStatus = useSelector<
    RootState,
    InputStatusResponse['inputStatus']
  >((state) => state.channel.context.inputStatus)
  const context = useContext(ChannelContext)

  const { control, trigger, getValues } = useForm<T>({
    // @ts-expect-error invalid default values.
    defaultValues: {
      ...handle.defaultValues,
      ...defaultValues,
    },
  })
  const onSubmit = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    if (handle.execute) {
      handle.execute({
        channelContext: context,
        values,
      })
    } else if (handle.buildCommand) {
      context.messageBus.execute(handle.buildCommand(values), true).then()
    } else {
      throw new Error(
        'The FormHandle should contains one of `execute` or `buildCommand` field at least.',
      )
    }
    onClose()
  }

  return (
    <>
      <ModalHeader>{handle.name}</ModalHeader>
      <ModalBody className="space-y-2">
        {handle.items.map((item) => {
          if (Array.isArray(item)) {
            return (
              <div className="flex items-center space-x-2">
                {item.map((groupedItem) => (
                  <ControlledInput
                    // @ts-expect-error damm, how i can i fix it?
                    control={control}
                    name={groupedItem.name}
                    key={groupedItem.name}
                    inputProps={{
                      isRequired: groupedItem.isRequired,
                      label: groupedItem.label,
                      type: groupedItem.type,
                    }}
                  />
                ))}
              </div>
            )
          }
          return (
            <ControlledInput
              // @ts-expect-error damm, how i can i fix it?
              control={control}
              key={item.name}
              name={item.name}
              inputProps={{
                isRequired: item.isRequired,
                label: item.label,
                type: item.type,
                spellCheck: 'false',
              }}
            />
          )
        })}
      </ModalBody>
      <ModalFooter className="flex items-center justify-between text-sm">
        <div className="text-danger w-0 grow">
          {inputStatus === 'ALLOW_INTERRUPT' && !handle.isSync
            ? '注意: 继续执行将中断当前正在监听的命令'
            : ''}
        </div>
        <div>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button color="primary" onPress={onSubmit}>
            确定
          </Button>
        </div>
      </ModalFooter>
    </>
  )
}
