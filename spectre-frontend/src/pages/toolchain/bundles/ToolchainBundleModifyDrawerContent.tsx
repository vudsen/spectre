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
import { handleError } from '@/common/util.ts'
import i18n from '@/i18n'
import {
  createToolchainBundle,
  updateToolchainBundle,
} from '@/api/impl/toolchain.ts'

type OldEntity = {
  id: string
  jattachTag: string
  arthasTag: string
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
          title: i18n.t('common.updateSuccess'),
          color: 'success',
        })
      } else {
        await createToolchainBundle(values)
        addToast({
          title: i18n.t(
            'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_001',
          ),
          color: 'success',
        })
      }
      props.onClose()
      props.onModified()
    } catch (e) {
      handleError(
        e,
        i18n.t(
          'hardcoded.msg_pages_toolchain_bundles_toolchainbundlemodifydrawercontent_001',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DrawerHeader>
        {i18n.t(
          'hardcoded.msg_pages_toolchain_bundles_toolchainbundlemodifydrawercontent_002',
        )}
      </DrawerHeader>
      <DrawerBody>
        <ControlledInput
          control={control}
          name="name"
          rules={{ required: true }}
          inputProps={{
            isRequired: true,
            label: i18n.t('hardcoded.msg_components_labeleditor_index_004'),
          }}
        />
        <ControlledSelect
          control={control}
          name="arthasTag"
          rules={{ required: true }}
          selectProps={{
            isRequired: true,
            label: 'Arthas',
            placeholder: i18n.t(
              'hardcoded.msg_pages_toolchain_bundles_toolchainbundlemodifydrawercontent_003',
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
            placeholder: i18n.t(
              'hardcoded.msg_pages_toolchain_bundles_toolchainbundlemodifydrawercontent_003',
            ),
            isLoading: isVersionsLoading,
          }}
        >
          {jattachVersions.map((it) => (
            <SelectItem key={it.id.tag}>{it.id.tag}</SelectItem>
          ))}
        </ControlledSelect>
        <div>
          <Alert
            title={i18n.t(
              'hardcoded.msg_pages_toolchain_bundles_toolchainbundlemodifydrawercontent_004',
            )}
            color="primary"
            variant="flat"
          />
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button color="danger" variant="light" onPress={props.onClose}>
          {i18n.t(
            'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_002',
          )}
        </Button>
        <Button color="primary" onPress={onSubmit} isLoading={isLoading}>
          {i18n.t('common.save')}
        </Button>
      </DrawerFooter>
    </>
  )
}

export default ToolchainBundleModifyDrawerContent
