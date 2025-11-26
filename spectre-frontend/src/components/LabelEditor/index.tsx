import { useCallback, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import LabelModifyModalContent from '@/components/LabelEditor/LabelModifyModalContent.tsx'

interface LabelEditorProps<
  Values extends FieldValues,
  MyPath extends Path<Values> = Path<Values>,
> {
  oldState?: Record<string, string>
  control: Control<Values>
  name: MyPath
}

type LabelValues = {
  key: string
  value: string
}

function combineLabels(lables: LabelValues[]): Record<string, string> {
  const base: Record<string, string> = {}
  for (const label of lables) {
    base[label.key] = label.value
  }
  return base
}

/**
 * 属性编辑器. 支持 react-hook-form，最终会返回 string kv 对
 * @param props
 * @constructor
 */
function LabelEditor<Values extends FieldValues>(
  props: LabelEditorProps<Values>,
) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [selectedLabel, setSelectedLabel] = useState<LabelValues | undefined>(
    undefined,
  )
  const [labels, setLabels] = useState<LabelValues[]>(() => {
    if (!props.oldState) {
      return []
    }
    return Object.entries(props.oldState).map((entry) => ({
      key: entry[0],
      value: entry[1],
    }))
  })
  const { field } = useController({
    name: props.name,
    control: props.control,
  })

  const onModify = (modified: LabelValues) => {
    const newLabels: LabelValues[] = []
    let isNew = true
    for (const label of labels) {
      if (label.key === modified.key) {
        isNew = false
        newLabels.push({
          key: label.key,
          value: modified.value,
        })
      } else {
        newLabels.push(label)
      }
    }
    if (isNew) {
      newLabels.push(modified)
    }
    field.onChange(combineLabels(newLabels))
    setLabels(newLabels)
  }

  const onEdit = useCallback(
    (target: LabelValues) => {
      setSelectedLabel(target)
      onOpen()
    },
    [onOpen],
  )

  const onDelete = useCallback(
    (target: LabelValues) => {
      setLabels((prev) => {
        const idx = prev.findIndex((label) => label.key === target.key)
        if (idx < 0) {
          return prev
        }
        const next = prev.toSpliced(idx, 1)
        field.onChange(combineLabels(next))
        return next
      })
    },
    [field],
  )

  const onCreate = useCallback(() => {
    setSelectedLabel(undefined)
    onOpen()
  }, [onOpen])

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between">
          <div className="header-2">标签</div>
          <div>
            <Button variant="flat" color="primary" size="sm" onPress={onCreate}>
              新增标签
            </Button>
          </div>
        </div>
        <div className="mb-3 text-sm">
          标签可以协助您在策略权限中进行更加精细的判断
        </div>
        <Table removeWrapper>
          <TableHeader>
            <TableColumn>名称</TableColumn>
            <TableColumn>值</TableColumn>
            <TableColumn align="end">操作</TableColumn>
          </TableHeader>
          <TableBody emptyContent="没有任何标签">
            {labels.map((attr) => (
              <TableRow key={attr.key}>
                <TableCell>{attr.key}</TableCell>
                <TableCell>{attr.value}</TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    color="primary"
                    variant="light"
                    size="sm"
                    onPress={() => onEdit(attr)}
                  >
                    <SvgIcon icon={Icon.EDIT} />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={() => onDelete(attr)}
                  >
                    <SvgIcon icon={Icon.TRASH} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Modal
          isOpen={isOpen}
          placement="top-center"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <LabelModifyModalContent
                onClose={onClose}
                onModify={onModify}
                label={selectedLabel}
              />
            )}
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  )
}

export default LabelEditor
