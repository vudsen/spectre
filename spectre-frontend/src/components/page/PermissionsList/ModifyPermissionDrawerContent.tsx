import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  createPolicyPermission,
  getEnhanceAuthenticationPages,
  getPolicyPermissionContextExample,
  type PolicyPermissionContextExample,
  type PolicyPermissionEnhancePlugin,
  updatePolicyPermission,
} from '@/api/impl/permission.ts'
import {
  addToast,
  Alert,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
} from '@heroui/react'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import ControlledTextarea from '@/components/validation/ControlledTextarea.tsx'
import ExtensionPageManager from '@/ext/manager.ts'
import type { FormComponentRef, FormPage } from '@/ext/type.ts'
import { graphql } from '@/graphql/generated'
import { execute } from '@/graphql/execute.ts'
import i18n from '@/i18n'

export type PermissionEntityWithState = {
  resource: string
  action: string
  name: string
  code: string
}

type PermissionEntity = {
  resource: string
  action: string
}

type OldPermission = {
  id: string
  conditionExpression: string
  description?: string | null
}

interface ModifyPermissionDrawerContentProps {
  permissionName: string
  subjectId: string
  /**
   * 该参数用于创建时使用
   */
  permission: PermissionEntity
  onClose: () => void
  /**
   * 该参数用于更新时使用
   */
  oldPermission?: OldPermission
  onModified?: () => void
}

type FormState = {
  expression: string
  description?: string | null
}

type EnhanceForm = {
  component: React.LazyExoticComponent<FormPage>
  oldState?: unknown
  pluginId: string
}

type EnhancePageParameters = {
  pluginId: string
}

const QueryPolicyPermissionPlugins = graphql(`
  query QueryPolicyPermissionPlugins($id: Long!) {
    permission {
      permission(id: $id) {
        enhancePlugins {
          configuration
          pluginId
        }
      }
    }
  }
`)

const ModifyPermissionDrawerContent: React.FC<
  ModifyPermissionDrawerContentProps
> = (props) => {
  const formControl = useForm<FormState>({
    defaultValues: {
      description: props.oldPermission?.description,
      expression: props.oldPermission?.conditionExpression ?? 'true',
    },
  })
  const { control, trigger, getValues } = formControl
  const [enhanceForms, setEnhanceForms] = useState<EnhanceForm[]>([])
  const [isLoading, setLoading] = useState(true)
  const refs = useRef<Array<FormComponentRef | null>>([])
  const [examples, setExamples] = useState<PolicyPermissionContextExample[]>([])

  useEffect(() => {
    getPolicyPermissionContextExample(
      props.permission.resource,
      props.permission.action,
    ).then((r) => {
      setExamples(r)
    })
    getEnhanceAuthenticationPages(
      props.permission.resource,
      props.permission.action,
    ).then(async (pages) => {
      refs.current = Array(pages.length)
      const forms: EnhanceForm[] = pages.map((p) => ({
        component: ExtensionPageManager.getFormPage(p.pageName),
        pluginId: (p.parameters as EnhancePageParameters).pluginId,
      }))

      // 设置 oldState
      if (props.oldPermission) {
        const result = await execute(QueryPolicyPermissionPlugins, {
          id: props.oldPermission.id,
        })
        const plugins = result.permission.permission?.enhancePlugins
        if (plugins) {
          for (const plugin of plugins) {
            const target = forms.find((v) => v.pluginId === plugin.pluginId)
            if (target) {
              target.oldState = JSON.parse(plugin.configuration)
            }
          }
        }
      }
      setEnhanceForms(forms)
      setLoading(false)
    })
  }, [props.oldPermission, props.permission])

  const onSave = async () => {
    if (!(await trigger())) {
      return
    }
    const values = getValues()
    const enhancePlugins: PolicyPermissionEnhancePlugin[] = []
    for (const form of refs.current) {
      const data = await form?.collect()
      if (!data) {
        return
      }
      enhancePlugins.push(data as unknown as PolicyPermissionEnhancePlugin)
    }
    setLoading(true)
    try {
      const oldId = props.oldPermission?.id
      let successMsg: string
      if (oldId) {
        successMsg = i18n.t('common.updateSuccess')
        await updatePolicyPermission({
          id: oldId,
          conditionExpression: values.expression,
          description: values.description,
          enhancePlugins,
        })
      } else {
        successMsg = i18n.t(
          'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_001',
        )
        await createPolicyPermission({
          subjectId: props.subjectId,
          resource: props.permission!.resource,
          action: props.permission!.action,
          subjectType: 'ROLE',
          conditionExpression: values.expression,
          description: values.description,
          enhancePlugins,
        })
      }
      props.onClose()
      addToast({
        title: successMsg,
        color: 'success',
      })
      props.onModified?.()
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <DrawerHeader>
        {i18n.t(
          'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_002',
        )}
        {props.permissionName}
        {i18n.t(
          'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_003',
        )}
      </DrawerHeader>
      <DrawerBody>
        <div>
          <Alert
            color="warning"
            title={i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_004',
            )}
          ></Alert>
        </div>
        <ControlledInput
          control={control}
          name="expression"
          rules={{ required: true }}
          inputProps={{
            label: i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_005',
            ),
            placeholder: i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_006',
            ),
            isRequired: true,
            spellCheck: 'false',
          }}
        />
        <ControlledTextarea
          control={control}
          name="description"
          inputProps={{
            label: i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_007',
            ),
            placeholder: i18n.t(
              'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_008',
            ),
          }}
        />
        {enhanceForms.map((form, index) => (
          <form.component
            ref={(ref) => {
              refs.current[index] = ref as unknown as FormComponentRef
            }}
            oldState={form.oldState}
            key={form.pluginId}
            pluginId={form.pluginId}
          />
        ))}
        {examples.length > 0 ? (
          <div className="space-y-3">
            <div>
              {i18n.t(
                'hardcoded.msg_components_page_permissionslist_modifypermissiondrawercontent_009',
              )}
            </div>
            {examples.map((example) => (
              <div key={example.name}>
                <div className="my-3 text-sm">{example.name}</div>
                <div className="text-default-700 bg-default-100 mx-3 box-border rounded-xl p-3 text-sm whitespace-pre-wrap">
                  {JSON.stringify(example.context, null, 2)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </DrawerBody>
      <DrawerFooter className="border-divider border-t-1">
        <Button
          color="danger"
          variant="light"
          onPress={props.onClose}
          disabled={isLoading}
        >
          {i18n.t(
            'hardcoded.msg_components_labeleditor_labelmodifymodalcontent_002',
          )}
        </Button>
        <Button color="primary" onPress={onSave} isLoading={isLoading}>
          {i18n.t('common.save')}
        </Button>
      </DrawerFooter>
    </>
  )
}

export default ModifyPermissionDrawerContent
