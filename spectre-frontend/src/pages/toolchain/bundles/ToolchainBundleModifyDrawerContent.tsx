import React, { useState } from 'react'
import {
  addToast,
  Alert,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  SelectItem,
} from '@heroui/react'
import ControlledSelect from '@/components/validation/ControlledSelect.tsx'
import { useForm } from 'react-hook-form'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { execute } from '@/graphql/execute.ts'
import { handleError } from '@/common/util.ts'
import { updateToolchainBundle } from '@/api/impl/toolchain.ts'

type OldEntity = {
  id: string
  jattachTag: string
  arthasTag: string
  httpClientTag: string
}

interface ToolchainBundleModifyDrawerContentProps {
  onClose: () => void
  oldEntity?: OldEntity
  onModified: () => void
}

type Values = {
  name: string
  arthasTag: string
  jattachTag: string
  httpClientTag: string
}

const QueryToolchainVersions = graphql(`
  query QueryToolchainVersions {
    arthas: toolchain {
      toolchainItems(type: "ARTHAS", page: 0, size: 10) {
        result {
          id {
            tag
          }
        }
      }
    }
    jattach: toolchain {
      toolchainItems(type: "JATTACH", page: 0, size: 10) {
        result {
          id {
            tag
          }
        }
      }
    }
    httpClient: toolchain {
      toolchainItems(type: "HTTP_CLIENT", page: 0, size: 10) {
        result {
          id {
            tag
          }
        }
      }
    }
  }
`)

const CreateToolchainBundle = graphql(`
  mutation CreateToolchainBundle($vo: ToolchainBundleModifyVO) {
    toolchain {
      createToolchainBundle(vo: $vo) {
        id
      }
    }
  }
`)

const ToolchainBundleModifyDrawerContent: React.FC<
  ToolchainBundleModifyDrawerContentProps
> = (props) => {
  const { isLoading: isVersionsLoading, result } = useGraphQL(
    QueryToolchainVersions,
  )
  const { control, trigger, getValues } = useForm<Values>({
    defaultValues: props.oldEntity,
  })
  const [isLoading, setLoading] = useState(false)

  const arthasVersions = result?.arthas.toolchainItems.result ?? []
  const jattachVersions = result?.jattach.toolchainItems.result ?? []
  const httpClientVersions = result?.httpClient.toolchainItems.result ?? []

  const onSubmit = async () => {
    const b = await trigger()
    if (!b) {
      return
    }
    setLoading(true)
    try {
      const values = getValues()
      if (props.oldEntity) {
        await updateToolchainBundle({
          id: props.oldEntity.id,
          ...values,
        })
        addToast({
          title: '更新成功',
          color: 'success',
        })
      } else {
        await execute(CreateToolchainBundle, {
          vo: values,
        })
        addToast({
          title: '添加成功',
          color: 'success',
        })
      }
      props.onClose()
      props.onModified()
    } catch (e) {
      handleError(e, '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DrawerHeader>新增工具包</DrawerHeader>
      <DrawerBody>
        <ControlledInput
          control={control}
          name="name"
          rules={{ required: true }}
          inputProps={{ isRequired: true, label: '名称' }}
        />
        <ControlledSelect
          control={control}
          name="arthasTag"
          rules={{ required: true }}
          selectProps={{
            isRequired: true,
            label: 'Arthas',
            placeholder: '请选择标签',
            isLoading: isVersionsLoading,
          }}
        >
          {arthasVersions.map((it) => (
            <SelectItem aria-label={it.id.tag} key={it.id.tag}>
              {it.id.tag}
            </SelectItem>
          ))}
        </ControlledSelect>
        <ControlledSelect
          control={control}
          name="jattachTag"
          rules={{ required: true }}
          selectProps={{
            isRequired: true,
            label: 'Jattach',
            placeholder: '请选择标签',
            isLoading: isVersionsLoading,
          }}
        >
          {jattachVersions.map((it) => (
            <SelectItem key={it.id.tag}>{it.id.tag}</SelectItem>
          ))}
        </ControlledSelect>
        <ControlledSelect
          control={control}
          name="httpClientTag"
          rules={{ required: true }}
          selectProps={{
            isRequired: true,
            label: 'HttpClient',
            placeholder: '请选择标签',
            isLoading: isVersionsLoading,
          }}
        >
          {httpClientVersions.map((it) => (
            <SelectItem key={it.id.tag}>{it.id.tag}</SelectItem>
          ))}
        </ControlledSelect>
        <div>
          <Alert
            title="仅显示最新的 10 个标签"
            color="primary"
            variant="flat"
          />
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button color="danger" variant="light" onPress={props.onClose}>
          关闭
        </Button>
        <Button color="primary" onPress={onSubmit} isLoading={isLoading}>
          保存
        </Button>
      </DrawerFooter>
    </>
  )
}

export default ToolchainBundleModifyDrawerContent
