import React, { useState } from 'react'
import {
  addToast,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  SelectItem,
  Tooltip,
} from '@heroui/react'
import ControlledSelect from '@/components/validation/ControlledSelect.tsx'
import { useForm } from 'react-hook-form'
import SvgIcon from '@/components/icon/SvgIcon.tsx'
import Icon from '@/components/icon/icon.ts'
import { graphql } from '@/graphql/generated'
import useGraphQL from '@/hook/useGraphQL.ts'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import { execute } from '@/graphql/execute.ts'
import { handleError } from '@/common/util.ts'

interface ToolchainBundleModifyDrawerContentProps {
  onClose: () => void
  oldEntity?: unknown
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
  const { control, trigger, getValues } = useForm<Values>()
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
      await execute(CreateToolchainBundle, {
        vo: values,
      })
      addToast({
        title: '添加成功',
        color: 'success',
      })
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
            endContent: (
              <Tooltip content="仅展示最新的 10 个标签">
                <SvgIcon icon={Icon.NOTE} size={24} />
              </Tooltip>
            ),
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
            endContent: (
              <Tooltip content="仅展示最新的 10 个标签">
                <SvgIcon icon={Icon.NOTE} size={24} />
              </Tooltip>
            ),
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
            endContent: (
              <Tooltip content="仅展示最新的 10 个标签">
                <SvgIcon icon={Icon.NOTE} size={24} />
              </Tooltip>
            ),
            isLoading: isVersionsLoading,
          }}
        >
          {httpClientVersions.map((it) => (
            <SelectItem key={it.id.tag}>{it.id.tag}</SelectItem>
          ))}
        </ControlledSelect>
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
