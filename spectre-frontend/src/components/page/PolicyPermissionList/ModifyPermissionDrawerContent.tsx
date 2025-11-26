import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  createPolicyPermission,
  getEnhanceAuthenticationPages,
  type PolicyPermissionEnhancePlugin,
  updatePolicyPermission,
} from '@/api/impl/policy-permission.ts'
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
    policyPermission {
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
      expression: props.oldPermission?.conditionExpression,
    },
  })
  const { control, trigger, getValues } = formControl
  const [enhanceForms, setEnhanceForms] = useState<EnhanceForm[]>([])
  const [isLoading, setLoading] = useState(true)
  const refs = useRef<Array<FormComponentRef | null>>([])

  useEffect(() => {
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
        const plugins = result.policyPermission.permission?.enhancePlugins
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
        successMsg = '更新成功'
        await updatePolicyPermission({
          id: oldId,
          conditionExpression: values.expression,
          description: values.description,
          enhancePlugins,
        })
      } else {
        successMsg = '添加成功'
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
      <DrawerHeader>添加'{props.permissionName}'权限</DrawerHeader>
      <DrawerBody>
        <div>
          <Alert
            color="warning"
            title="目前没有限制表达式的使用，用户可以使用 T(...) 等操作新建任意的类，请严格限制相关创建权限的分配"
          ></Alert>
        </div>
        <ControlledInput
          control={control}
          name="expression"
          rules={{ required: true }}
          inputProps={{
            label: 'SpEL 表达式',
            placeholder: '请输入表达式',
            isRequired: true,
            spellCheck: 'false',
          }}
        />
        <ControlledTextarea
          control={control}
          name="description"
          inputProps={{
            label: '描述',
            placeholder: '请输入描述',
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
      </DrawerBody>
      <DrawerFooter className="border-divider border-t-1">
        <Button
          color="danger"
          variant="light"
          onPress={props.onClose}
          disabled={isLoading}
        >
          关闭
        </Button>
        <Button color="primary" onPress={onSave} isLoading={isLoading}>
          保存
        </Button>
      </DrawerFooter>
    </>
  )
}

export default ModifyPermissionDrawerContent
