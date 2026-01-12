import React from 'react'
import { useForm } from 'react-hook-form'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react'

interface WatchCommandModalProps {
  classname?: string
  onClose: () => void
}

type WatchValues = {
  classname: string
  count: number
  depth: number
  expression: string
}

const WatchCommandModalContent: React.FC<WatchCommandModalProps> = (props) => {
  const { control } = useForm<WatchValues>({
    defaultValues: {
      expression: '{params, target, returnObj}',
      count: -1,
      depth: 2,
      classname: props.classname,
    },
  })
  return (
    <>
      <ModalHeader>Watch</ModalHeader>
      <ModalBody className="space-y-2">
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="classname"
          inputProps={{
            label: 'Classname',
            isRequired: true,
            labelPlacement: 'outside-top',
          }}
        />
        <div className="flex items-center">
          <ControlledInput
            control={control}
            rules={{ required: true }}
            name="count"
            inputProps={{
              label: '观测次数',
              type: 'number',
              isRequired: true,
              labelPlacement: 'outside-top',
              className: 'mr-3',
            }}
          />
          <ControlledInput
            control={control}
            rules={{ required: true }}
            name="depth"
            inputProps={{
              label: '遍历深度',
              type: 'number',
              isRequired: true,
              labelPlacement: 'outside-top',
            }}
          />
        </div>
        <ControlledInput
          control={control}
          name="expression"
          inputProps={{
            label: '观测表达式',
            type: 'expression',
            labelPlacement: 'outside-top',
            spellCheck: 'false',
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light">
          取消
        </Button>
        <Button color="primary">确定</Button>
      </ModalFooter>
    </>
  )
}

export default WatchCommandModalContent
