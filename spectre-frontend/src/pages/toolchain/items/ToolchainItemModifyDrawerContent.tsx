import React, { useState } from 'react'
import {
  addToast,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Link,
  SelectItem,
} from '@heroui/react'
import { useForm } from 'react-hook-form'
import ControlledSelect from '@/components/validation/ControlledSelect.tsx'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import type { SharedSelection } from '@heroui/system'
import { handleError } from '@/common/util.ts'
import toolchainTypes, { type ToolchainItemType } from './ToolchainItemType.ts'
import { saveToolchainItem } from '@/api/impl/toolchain.ts'
import i18n from '@/i18n'

interface ToolchainItemModifyDrawerContentProps {
  onClose: () => void
  oldEntity?: unknown
  onModified: () => void
  type: string
}

export type ToolchainItemValues = {
  tag: string
  type: string
  url: string
  armUrl?: string
}

const ToolchainItemModifyDrawerContent: React.FC<
  ToolchainItemModifyDrawerContentProps
> = (props) => {
  const { control, trigger, getValues } = useForm<ToolchainItemValues>()
  const [selectedType, setSelectedType] = useState<
    ToolchainItemType | undefined
  >(() => {
    return toolchainTypes.find((t) => t.type === props.type)
  })
  const [isLoading, setLoading] = useState(false)
  const onSelectionChange = (keys: SharedSelection) => {
    setSelectedType(toolchainTypes.find((v) => v.type === keys.currentKey))
  }

  const onSubmit = async () => {
    const b = await trigger()
    if (!b) {
      return
    }
    setLoading(true)
    try {
      const values = getValues()
      saveToolchainItem(values)
      addToast({
        title: i18n.t('hardcoded.msg_pages_settings_llmform_001'),
        color: 'success',
      })
      props.onClose()
      props.onModified()
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <DrawerHeader>
        {i18n.t(
          'hardcoded.msg_pages_toolchain_items_toolchainitemmodifydrawercontent_001',
        )}
      </DrawerHeader>
      <DrawerBody>
        <ControlledSelect
          control={control}
          name="type"
          rules={{ required: true }}
          selectProps={{
            isRequired: true,
            label: i18n.t('hardcoded.msg_ext_view_k8sview_003'),
            onSelectionChange,
            defaultSelectedKeys: [props.type],
          }}
        >
          {toolchainTypes.map((item) => (
            <SelectItem key={item.type} description={item.description}>
              {item.name}
            </SelectItem>
          ))}
        </ControlledSelect>
        <ControlledInput
          control={control}
          rules={{ required: true }}
          name="tag"
          inputProps={{
            isRequired: true,
            label: i18n.t('hardcoded.msg_components_labeleditor_index_001'),
          }}
        />
        <ControlledInput
          control={control}
          name="url"
          rules={{ required: true }}
          inputProps={{
            isRequired: true,
            description: selectedType ? (
              <div>
                {selectedType.urlGuide}
                {i18n.t(
                  'hardcoded.msg_pages_toolchain_items_toolchainitemmodifydrawercontent_002',
                )}{' '}
                <Link size="sm" isExternal href={selectedType.url}>
                  Release
                </Link>
              </div>
            ) : null,
            label: i18n.t(
              'hardcoded.msg_pages_toolchain_items_toolchainitemmodifydrawercontent_003',
            ),
          }}
        />
        {selectedType && selectedType.hasMultiplatformBundle ? (
          <ControlledInput
            control={control}
            name="armUrl"
            rules={{ required: true }}
            inputProps={{
              isRequired: true,
              label: i18n.t(
                'hardcoded.msg_pages_toolchain_items_toolchainitemmodifydrawercontent_004',
              ),
            }}
          />
        ) : null}
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

export default ToolchainItemModifyDrawerContent
